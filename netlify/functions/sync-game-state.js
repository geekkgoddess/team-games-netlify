// In-memory game store (persists for duration of Netlify function instance)
const gameStore = {}

// Auto-cleanup games older than 2 hours
const cleanup = () => {
  const now = Date.now()
  const TWO_HOURS = 2 * 60 * 60 * 1000
  for (const gameId in gameStore) {
    if (now - gameStore[gameId].lastUpdate > TWO_HOURS) {
      delete gameStore[gameId]
    }
  }
}

exports.handler = async (event) => {
  cleanup()

  // CORS headers so Windows/Mac/mobile all work
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // POST: Update game state
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body)
      const { gameId, state, action } = body

      if (!gameId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'gameId required' }) }
      }

      const existing = gameStore[gameId] || {}

      // FIX: 'addPlayer' action merges player into existing list
      // instead of overwriting — prevents players disappearing
      if (action === 'addPlayer') {
        const newPlayer = state.newPlayer
        const currentPlayers = existing.players || []

        // Only add if not already in list
        const alreadyJoined = currentPlayers.find(p => p.name === newPlayer.name)
        const updatedPlayers = alreadyJoined
          ? currentPlayers
          : [...currentPlayers, newPlayer]

        gameStore[gameId] = {
          ...existing,
          players: updatedPlayers,
          scores: {
            ...existing.scores,
            [newPlayer.name]: existing.scores?.[newPlayer.name] ?? 0
          },
          lastUpdate: Date.now()
        }
      } else {
        // Regular full state update (host syncing game state)
        gameStore[gameId] = {
          ...existing,
          ...state,
          lastUpdate: Date.now()
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, players: gameStore[gameId].players || [] })
      }

    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid body' }) }
    }
  }

  // GET: Fetch current game state
  if (event.httpMethod === 'GET') {
    const { gameId } = event.queryStringParameters || {}

    if (!gameId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'gameId required' }) }
    }

    const state = gameStore[gameId] || {}
    return { statusCode: 200, headers, body: JSON.stringify(state) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
