import { useState, useEffect } from 'react'
import GuessTheCoworker from './games/GuessTheCoworker'
import TwoTruthsAndALie from './games/TwoTruthsAndALie'
import TeamsAgainstHumanity from './games/TeamsAgainstHumanity'
import RoleSelector from './components/RoleSelector'
import GameCodeEntry from './components/GameCodeEntry'
import RulesScreen from './components/RulesScreen'
import PlayerSetup from './components/PlayerSetup'
import GameRating from './components/GameRating'
import HostLobby from './components/HostLobby'
import { generateGameCode } from './utils/gameUtils'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('role')
  const [role, setRole] = useState(null)
  const [currentGame, setCurrentGame] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [gameCode, setGameCode] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [playerAvatar, setPlayerAvatar] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    const url = new URL(window.location)
    const gameIdParam = url.searchParams.get('gameId')
    const isHostParam = url.searchParams.get('host') === 'true'
    if (gameIdParam) {
      const game = url.searchParams.get('game')
      setGameId(gameIdParam)
      setIsHost(isHostParam)
      setCurrentGame(game)
      setScreen('game')
    }
  }, [])

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole)
    if (selectedRole === 'host') {
      setIsHost(true)
      setScreen('host-menu')
    } else {
      setIsHost(false)
      setScreen('code-entry')
    }
  }

  const handleCodeSubmit = (code) => {
    setGameCode(code)
    setGameId(code)
    setScreen('rules')
  }

  const gameRules = {
    'guess-coworker': [
      'A clue will be displayed describing one team member',
      'Everyone votes on who they think the clue describes',
      'After voting closes, the answer is revealed',
      'Correct guesses earn 10 points',
      'Multiple rounds keep building your score'
    ],
    '2-truths': [
      'One player tells 2 truths and 1 lie about themselves',
      'Everyone votes on which statement is the lie',
      'Correct guesses earn 5 points',
      'Players who guess wrong perform a fun challenge',
      'Roles rotate each round'
    ],
    'tah': [
      'A prompt is displayed to all players',
      'Players submit absurd answers to the prompt',
      'The host judges and awards points to the funniest answer',
      'The winning team gets 10 points',
      'New prompts keep the game flowing'
    ]
  }

  const handlePlayerSetupComplete = (name, avatar) => {
    setPlayerName(name)
    setPlayerAvatar(avatar)
    setScreen('game')
  }

  const selectGame = (gameName) => {
    const newGameId = generateGameCode()
    setGameId(newGameId)
    setGameCode(newGameId)
    setCurrentGame(gameName)
    setScreen('host-lobby')
  }

  const startGame = () => {
    const url = new URL(window.location)
    url.searchParams.set('gameId', gameId)
    url.searchParams.set('game', currentGame)
    url.searchParams.set('host', 'true')
    window.history.replaceState({}, '', url)
    setScreen('game')
  }

  const handleGameEnd = (finalLeaderboard) => {
    setLeaderboard(finalLeaderboard)
    setScreen('rating')
  }

  const handleRatingSubmit = (rating) => {
    console.log('Game rated:', rating)
    goHome()
  }

  const goHome = () => {
    setScreen('role')
    setRole(null)
    setCurrentGame(null)
    setGameId(null)
    setGameCode(null)
    setPlayerName('')
    setPlayerAvatar('')
    setIsHost(false)
    setLeaderboard([])
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (screen === 'role') return <RoleSelector onSelectRole={handleSelectRole} />
  if (screen === 'host-menu') return <GameMenu onStartGame={selectGame} onBack={goHome} />
  if (screen === 'host-lobby') return <HostLobby gameCode={gameCode} gameName={currentGame} onStartGame={startGame} onBack={() => setScreen('host-menu')} />
  if (screen === 'code-entry') return <GameCodeEntry onCodeSubmit={handleCodeSubmit} onBack={() => setScreen('role')} />
  if (screen === 'rules') {
    return <RulesScreen gameTitle={getGameTitle(currentGame)} rules={gameRules[currentGame] || []} onAgree={() => setScreen('player-setup')} onBack={() => setScreen('code-entry')} />
  }
  if (screen === 'player-setup') return <PlayerSetup onReady={handlePlayerSetupComplete} onBack={() => setScreen('rules')} />
  if (screen === 'rating') return <GameRating gameTitle={getGameTitle(currentGame)} leaderboard={leaderboard} onSubmit={handleRatingSubmit} onSkip={goHome} />

  if (screen === 'game' && currentGame && gameId) {
    const gameProps = { gameId, isHost, playerName, playerAvatar, gameCode, onExit: goHome, onGameEnd: handleGameEnd }
    switch (currentGame) {
      case 'guess-coworker': return <GuessTheCoworker {...gameProps} />
      case '2-truths': return <TwoTruthsAndALie {...gameProps} />
      case 'tah': return <TeamsAgainstHumanity {...gameProps} />
      default: return <GameMenu onStartGame={selectGame} onBack={goHome} />
    }
  }

  return null
}

function getGameTitle(gameName) {
  const titles = { 'guess-coworker': '👥 Guess the Coworker', '2-truths': '🤥 2 Truths & A Lie', 'tah': '🎭 Teams Against Humanity' }
  return titles[gameName] || 'Team Games'
}

function GameMenu({ onStartGame, onBack }) {
  return (
    <div className="menu-container">
      <button onClick={onBack} style={{ position:'absolute', top:'20px', left:'20px', background:'#444', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }}>← Back</button>
      <div className="menu-header">
        <h1>🎮 TEAM GAMES</h1>
        <p>Pick a game to play</p>
      </div>
      <div className="games-grid">
        <GameCard title="Guess the Coworker" description="Who is it? Clue-based guessing game with voting and live scoring" emoji="🧑" onClick={() => onStartGame('guess-coworker')} />
        <GameCard title="2 Truths & A Lie" description="Challenge Edition - Guess the lie and complete hilarious challenges" emoji="🤥" onClick={() => onStartGame('2-truths')} />
        <GameCard title="Teams Against Humanity" description="Match game prompts with absurd answers. Facilitator judges and awards points" emoji="🎭" onClick={() => onStartGame('tah')} />
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
