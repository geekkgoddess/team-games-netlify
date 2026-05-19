// In-memory game store (persists for duration of game session)
const gameStore = {}

// Auto-cleanup old games (older than 2 hours)
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

  // POST: Host syncs game state
  if (event.httpMethod === 'POST') {
    const { gameId, state } = JSON.parse(event.body)
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId required' })
      }
    }

    gameStore[gameId] = {
      ...state,
      lastUpdate: Date.now()
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  }

  // GET: Players/viewers fetch game state
  if (event.httpMethod === 'GET') {
    const { gameId } = event.queryStringParameters || {}
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId required' })
      }
    }

    const state = gameStore[gameId] || {}

    return {
      statusCode: 200,
      body: JSON.stringify(state)
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  }
}
