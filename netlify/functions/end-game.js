exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { gameId } = JSON.parse(event.body)
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId required' })
      }
    }

    // Game end confirmation
    // The client-side handles cleanup and leaderboard finalization
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Game ${gameId} ended`
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to end game' })
    }
  }
}
