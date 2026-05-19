// Reference to the gameStore from sync-game-state
// In a real setup, this would be shared or use a database
// For now, we'll create a simple wrapper

const gameStore = {}

// Note: In production, this would use a shared database
// For this setup, the sync-game-state function manages the store
// This function can be called by players to get the latest state

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { gameId } = event.queryStringParameters || {}
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId required' })
      }
    }

    // For this implementation, sync-game-state handles the store
    // Players should fetch from sync-game-state endpoint
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Use sync-game-state endpoint for game state',
        endpoint: '/api/sync-game-state?gameId=' + gameId
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get game state' })
    }
  }
}
