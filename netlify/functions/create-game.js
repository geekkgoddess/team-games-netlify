exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { gameName } = JSON.parse(event.body)
    
    // Generate unique game ID
    const gameId = Math.random().toString(36).substring(2, 11)

    return {
      statusCode: 200,
      body: JSON.stringify({
        gameId,
        gameName,
        createdAt: Date.now()
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create game' })
    }
  }
}
