exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { gameId, playerName, votedFor } = JSON.parse(event.body)
    
    if (!gameId || !playerName || !votedFor) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId, playerName, and votedFor required' })
      }
    }

    // Vote confirmation
    // The actual state is managed client-side and synced via sync-game-state
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Vote received from ${playerName}`,
        votedFor
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to submit vote' })
    }
  }
}
