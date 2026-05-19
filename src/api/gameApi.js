const API_BASE = '/api'

export async function createGame(gameName) {
  const response = await fetch(`${API_BASE}/create-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameName, createdAt: Date.now() })
  })
  return response.json()
}

export async function getGameState(gameId) {
  const response = await fetch(`${API_BASE}/get-game-state?gameId=${gameId}`)
  return response.json()
}

export async function syncGameState(gameId, state) {
  const response = await fetch(`${API_BASE}/sync-game-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, state, timestamp: Date.now() })
  })
  return response.json()
}

export async function submitAnswer(gameId, playerName, answer) {
  const response = await fetch(`${API_BASE}/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, playerName, answer, timestamp: Date.now() })
  })
  return response.json()
}

export async function submitVote(gameId, playerName, votedFor) {
  const response = await fetch(`${API_BASE}/submit-vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, playerName, votedFor, timestamp: Date.now() })
  })
  return response.json()
}

export async function awardPoints(gameId, playerName, points) {
  const response = await fetch(`${API_BASE}/award-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, playerName, points, timestamp: Date.now() })
  })
  return response.json()
}

export async function endGame(gameId) {
  const response = await fetch(`${API_BASE}/end-game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId })
  })
  return response.json()
}
