import { useState, useEffect } from 'react'
import GuessTheCoworker from './games/GuessTheCoworker'
import TwoTruthsAndALie from './games/TwoTruthsAndALie'
import TeamsAgainstHumanity from './games/TeamsAgainstHumanity'
import './App.css'

export default function App() {
  const [currentGame, setCurrentGame] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    // Check if we're joining an existing game
    const url = new URL(window.location)
    const gameIdParam = url.searchParams.get('gameId')
    const isHostParam = url.searchParams.get('host') === 'true'
    
    if (gameIdParam) {
      const game = url.searchParams.get('game')
      setGameId(gameIdParam)
      setIsHost(isHostParam)
      setCurrentGame(game)
    }
  }, [])

  const startGame = (gameName, asHost = true) => {
    const newGameId = Math.random().toString(36).substring(2, 11)
    setGameId(newGameId)
    setIsHost(asHost)
    setCurrentGame(gameName)
    
    // Update URL
    const url = new URL(window.location)
    url.searchParams.set('gameId', newGameId)
    url.searchParams.set('game', gameName)
    url.searchParams.set('host', asHost)
    window.history.replaceState({}, '', url)
  }

  const goHome = () => {
    setCurrentGame(null)
    setGameId(null)
    setIsHost(false)
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (currentGame && gameId) {
    const gameProps = { gameId, isHost, onExit: goHome }
    
    switch(currentGame) {
      case 'guess-coworker':
        return <GuessTheCoworker {...gameProps} />
      case '2-truths':
        return <TwoTruthsAndALie {...gameProps} />
      case 'tah':
        return <TeamsAgainstHumanity {...gameProps} />
      default:
        return <GameMenu onStartGame={startGame} />
    }
  }

  return <GameMenu onStartGame={startGame} />
}

function GameMenu({ onStartGame }) {
  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>🎮 TEAM GAMES</h1>
        <p>Real-time interactive games for your team</p>
      </div>

      <div className="games-grid">
        <GameCard
          title="Guess the Coworker"
          description="Who is it? Clue-based guessing game with voting and live scoring"
          emoji="🧑"
          onClick={() => onStartGame('guess-coworker')}
        />
        
        <GameCard
          title="2 Truths & A Lie"
          description="Challenge Edition - Guess the lie and complete hilarious challenges"
          emoji="🤥"
          onClick={() => onStartGame('2-truths')}
        />
        
        <GameCard
          title="Teams Against Humanity"
          description="Match game prompts with absurd answers. Facilitator judges and awards points"
          emoji="🎭"
          onClick={() => onStartGame('tah')}
        />
      </div>

      <div className="menu-footer">
        <p>✨ All games support real-time multiplayer</p>
        <p>Host shares their screen, players participate on their devices</p>
      </div>
    </div>
  )
}

function GameCard({ title, description, emoji, onClick }) {
  return (
    <div className="game-card" onClick={onClick}>
      <div className="game-emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="play-button">Play</button>
    </div>
  )
}
