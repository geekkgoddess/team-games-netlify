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
  const [loadingCode, setLoadingCode] = useState(false)
  const [codeError, setCodeError] = useState('')

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

  // FIX: Wait for fetch to complete before moving to rules screen
  const handleCodeSubmit = async (code) => {
    setLoadingCode(true)
    setCodeError('')
    setGameCode(code)
    setGameId(code)

    try {
      const response = await fetch(`/api/sync-game-state?gameId=${code}`)
      const data = await response.json()
      if (data && data.gameName) {
        setCurrentGame(data.gameName)
        setLoadingCode(false)
        setScreen('rules')
      } else {
        // Game exists but no gameName yet — still let them in with generic rules
        setCurrentGame('guess-coworker') // fallback
        setLoadingCode(false)
        setScreen('rules')
      }
    } catch (e) {
      console.log('Could not fetch game info, using fallback')
      setCurrentGame('guess-coworker') // fallback so screen never stays blank
      setLoadingCode(false)
      setScreen('rules')
    }
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

  const gameTitles = {
    'guess-coworker': '👥 Guess the Coworker',
    '2-truths': '🤥 2 Truths & A Lie',
    'tah': '🎭 Teams Against Humanity'
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
    setLoadingCode(false)
    setCodeError('')
    window.history.replaceState({}, '', window.location.pathname)
  }

  // --- SCREENS ---

  if (screen === 'role') {
    return <RoleSelector onSelectRole={handleSelectRole} />
  }

  if (screen === 'host-menu') {
    return <GameMenu onStartGame={selectGame} onBack={goHome} />
  }

  if (screen === 'host-lobby') {
    return (
      <HostLobby
        gameCode={gameCode}
        gameName={currentGame}
        onStartGame={startGame}
        onBack={() => setScreen('host-menu')}
      />
    )
  }

  // FIX: Show loading spinner while fetching game info
  if (screen === 'code-entry' || loadingCode) {
    return (
      <GameCodeEntry
        onCodeSubmit={handleCodeSubmit}
        onBack={() => setScreen('role')}
        loading={loadingCode}
        error={codeError}
      />
    )
  }

  if (screen === 'rules') {
    const rules = gameRules[currentGame] || gameRules['guess-coworker']
    const title = gameTitles[currentGame] || 'Team Games'
    return (
      <RulesScreen
        gameTitle={title}
        rules={rules}
        onAgree={() => setScreen('player-setup')}
        onBack={() => setScreen('code-entry')}
      />
    )
  }

  if (screen === 'player-setup') {
    return (
      <PlayerSetup
        onReady={handlePlayerSetupComplete}
        onBack={() => setScreen('rules')}
      />
    )
  }

  if (screen === 'rating') {
    return (
      <GameRating
        gameTitle={gameTitles[currentGame] || 'Team Games'}
        leaderboard={leaderboard}
        onSubmit={handleRatingSubmit}
        onSkip={goHome}
      />
    )
  }

  // FIX: If currentGame is somehow null on game screen, show error instead of blank
  if (screen === 'game') {
    if (!currentGame || !gameId) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'16px' }}>
          <p style={{ color:'#ffd700', fontSize:'1.2rem' }}>⚠️ Something went wrong loading the game.</p>
          <button onClick={goHome} style={{ background:'#ffd700', color:'#000', border:'none', padding:'12px 24px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}>
            ← Go Back Home
          </button>
        </div>
      )
    }

    const gameProps = {
      gameId,
      isHost,
      playerName,
      playerAvatar,
      gameCode,
      onExit: goHome,
      onGameEnd: handleGameEnd
    }
    switch (currentGame) {
      case 'guess-coworker': return <GuessTheCoworker {...gameProps} />
      case '2-truths': return <TwoTruthsAndALie {...gameProps} />
      case 'tah': return <TeamsAgainstHumanity {...gameProps} />
      default: return <GameMenu onStartGame={selectGame} onBack={goHome} />
    }
  }

  return null
}

function GameMenu({ onStartGame, onBack }) {
  return (
    <div className="menu-container">
      <button onClick={onBack} style={{
        position:'absolute', top:'20px', left:'20px',
        background:'#444', color:'white', border:'none',
        padding:'10px 20px', borderRadius:'8px', cursor:'pointer'
      }}>← Back</button>
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
        <p>Host shares their screen, players join on their own devices</p>
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
