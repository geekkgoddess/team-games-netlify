import { useState, useEffect } from 'react'
import '../styles/HostLobby.css'

export default function HostLobby({ gameCode, gameName, onStartGame, onBack }) {
  const [copied, setCopied] = useState(false)
  const [players, setPlayers] = useState([])

  // Poll for players joining
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameCode}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
      } catch (e) {
        // Not yet — no players joined
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [gameCode])

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gameNames = {
    'guess-coworker': '👥 Guess the Coworker',
    '2-truths': '🤥 2 Truths & A Lie',
    'tah': '🎭 Teams Against Humanity'
  }

  return (
    <div className="host-lobby-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="host-lobby">
        <h1>🎮 Game Lobby</h1>
        <h2>{gameNames[gameName] || gameName}</h2>

        <div className="code-display">
          <p className="code-label">Share this code with your players:</p>
          <div className="game-code">{gameCode}</div>
          <button className="copy-btn" onClick={copyCode}>
            {copied ? '✅ Copied!' : '📋 Copy Code'}
          </button>
        </div>

        <div className="join-instructions">
          <p>Players go to:</p>
          <div className="url-display">{window.location.origin}</div>
          <p>→ Select <strong>Player</strong> → Enter code <strong>{gameCode}</strong></p>
        </div>

        <div className="players-waiting">
          <h3>Players Joined: {players.length}</h3>
          {players.length === 0 ? (
            <p className="waiting-msg">⏳ Waiting for players to join...</p>
          ) : (
            <div className="players-list">
              {players.map((p, idx) => (
                <div key={idx} className="player-joined">
                  <span>{p.avatar || '🎭'}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="start-btn"
          onClick={onStartGame}
          disabled={players.length < 1}
        >
          {players.length < 1 ? 'Waiting for players...' : `Start Game (${players.length} players)`}
        </button>

        <p className="skip-hint">
          <button className="skip-btn" onClick={onStartGame}>
            Start anyway (solo test) →
          </button>
        </p>
      </div>
    </div>
  )
}
