exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { gameId, playerName, points } = JSON.parse(event.body)
    
    if (!gameId || !playerName || points === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId, playerName, and points required' })
      }
    }

    // This is handled by the client-side state management
    // The host broadcasts the updated scores via sync-game-state
    // This function just acknowledges the request

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Awarded ${points} points to ${playerName}`
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to award points' })
    }
  }
}
