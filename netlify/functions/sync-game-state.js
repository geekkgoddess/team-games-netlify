// In-memory game store (persists for duration of Netlify function instance)
const gameStore = {}

const PHASE_ORDER = {
  waiting: 0,
  voting: 1,
  reveal: 2,
  'leaderboard-pause': 3,
  results: 4
}

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
        // For votes, submissions, answers — merge instead of replace
        const merged = {
          ...existing,
          ...state,
          lastUpdate: Date.now()
        }
        let ignoreRoundReset = false
        const isGuessTheCoworker = existing.gameName === 'guess-coworker' || state.gameName === 'guess-coworker'
        const existingRound = existing.roundCount || 0
        const incomingRound = state.roundCount || existingRound
        const staleGuessRound = isGuessTheCoworker && state.roundCount !== undefined && incomingRound < existingRound

        if (staleGuessRound) {
          ignoreRoundReset = true
          merged.phase = existing.phase
          merged.roundCount = existing.roundCount
          merged.clues = existing.clues
          merged.answer = existing.answer
          merged.votes = existing.votes
          merged.scores = existing.scores
          merged.guessedCorrectly = existing.guessedCorrectly
          merged.roundStartedAt = existing.roundStartedAt
          merged.leaderboardPauseTimer = existing.leaderboardPauseTimer
          merged.usedTeamMemberIndices = existing.usedTeamMemberIndices
          merged.usedClues = existing.usedClues
        }

        // A slow lobby request should never rewind an active game back to
        // the player-join screen.
        if (state.phase === 'waiting' && existing.phase && existing.phase !== 'waiting' && !state.allowWaitingReset) {
          merged.phase = existing.phase
        }

        // Prevent stale requests from rewinding the game phase. This is the
        // flicker guard: a late "voting" write from an older round should not
        // pull players back from reveal, leaderboard, or final results.
        if (state.phase && existing.phase && state.phase !== existing.phase) {
          const existingRank = PHASE_ORDER[existing.phase]
          const incomingRank = PHASE_ORDER[state.phase]
          const startsNewRound = state.phase === 'voting' && incomingRound > existingRound
          const explicitlyResetting = state.allowWaitingReset || state.allowResultsReset

          if (
            existingRank !== undefined &&
            incomingRank !== undefined &&
            incomingRank < existingRank &&
            !startsNewRound &&
            !explicitlyResetting
          ) {
            ignoreRoundReset = true
            merged.phase = existing.phase
            merged.roundCount = existing.roundCount
            merged.clues = existing.clues
            merged.answer = existing.answer
            merged.roundStartedAt = existing.roundStartedAt
            merged.leaderboardPauseTimer = existing.leaderboardPauseTimer
          }

          if (existing.phase === 'results' && state.phase !== 'results' && !state.allowResultsReset) {
            ignoreRoundReset = true
            merged.phase = existing.phase
            merged.roundCount = existing.roundCount
            merged.clues = existing.clues
            merged.answer = existing.answer
            merged.votes = existing.votes
            merged.scores = existing.scores
            merged.guessedCorrectly = existing.guessedCorrectly
            merged.roundStartedAt = existing.roundStartedAt
            merged.leaderboardPauseTimer = existing.leaderboardPauseTimer
            merged.usedTeamMemberIndices = existing.usedTeamMemberIndices
            merged.usedClues = existing.usedClues
          }
        }

        // Deep-merge round data during play, but allow hosts to explicitly
        // reset it when starting a fresh round.
        if (state.votes !== undefined) {
          const staleGuessVote = isGuessTheCoworker && state.roundCount !== undefined && incomingRound !== existingRound && !state.resetVotes
          merged.votes = staleGuessVote
            ? existing.votes
            : state.resetVotes && !ignoreRoundReset ? state.votes : { ...existing.votes, ...state.votes }
        }
        if (state.submissions !== undefined) {
          merged.submissions = state.resetSubmissions && !ignoreRoundReset ? state.submissions : { ...existing.submissions, ...state.submissions }
        }
        if (state.answered !== undefined && Array.isArray(state.answered)) {
          if (state.resetAnswered) {
            merged.answered = state.answered
          } else {
            const existing_answered = existing.answered || []
            merged.answered = [...new Set([...existing_answered, ...state.answered])]
          }
        }
        delete merged.resetVotes
        delete merged.resetSubmissions
        delete merged.resetAnswered

        gameStore[gameId] = merged
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
