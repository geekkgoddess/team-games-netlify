import { useState, useEffect } from 'react'
import { syncGameState } from '../api/gameApi'
import GameLayout from './components/GameLayout'
import './games.css'

const CHALLENGES = [
  "Do 20 pushups",
  "Sing a song for 30 seconds",
  "Speak in an accent for 1 round",
  "Do your best impression of someone on the team",
  "Read the next 5 messages in a silly voice",
  "Do a funny dance on camera",
  "Put a pillow on your head for 2 minutes",
  "Pretend to be a cooking show host for 1 minute",
  "Sing happy birthday to someone",
  "Do a handstand (or try to)",
  "Make 3 animal sounds",
  "Juggle 3 items (or pretend to)",
  "Do a cartwheel",
  "Speak backwards for 30 seconds",
  "Do your best superhero pose",
  "Recite the alphabet backwards",
  "Do 10 jumping jacks"
]

export default function TwoTruthsAndALie({ gameId, isHost, onExit }) {
  const [phase, setPhase] = useState('setup') // setup, enter-statements, guessing, reveal, challenge, results
  const [players, setPlayers] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [scores, setScores] = useState({})
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [statements, setStatements] = useState(['', '', ''])
  const [lie, setLie] = useState(null)
  const [votes, setVotes] = useState({})
  const [guessedCorrectly, setGuessedCorrectly] = useState([])
  const [wrongGuessers, setWrongGuessers] = useState([])
  const [timer, setTimer] = useState(20)
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [usedChallenges, setUsedChallenges] = useState([])

  // Host polling
  useEffect(() => {
    if (!isHost || phase === 'setup') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.scores) setScores(data.scores)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost, phase])

  // Player polling
  useEffect(() => {
    if (isHost) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.phase) setPhase(data.phase)
        if (data.currentPlayer) setCurrentPlayer(data.currentPlayer)
        if (data.statements) setStatements(data.statements)
        if (data.timer !== undefined) setTimer(data.timer)
        if (data.votes) setVotes(data.votes)
        if (data.lie !== undefined) setLie(data.lie)
        if (data.scores) setScores(data.scores)
        if (data.currentChallenge) setCurrentChallenge(data.currentChallenge)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost])

  // Timer
  useEffect(() => {
    if (phase !== 'guessing' || timer <= 0) return

    const timeout = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(timeout)
  }, [timer, phase])

  const addPlayer = (name) => {
    if (!name || players.find(p => p.name === name)) return
    const newPlayers = [...players, { name }]
    setPlayers(newPlayers)
    setScores({ ...scores, [name]: 0 })
  }

  const startNextRound = async () => {
    const nextPlayer = players[Object.keys(scores).filter(p => p !== currentPlayer?.name).length % players.length]
    
    setCurrentPlayer(nextPlayer)
    setStatements(['', '', ''])
    setLie(null)
    setVotes({})
    setPhase('enter-statements')

    await syncGameState(gameId, {
      phase: 'enter-statements',
      players,
      scores,
      currentPlayer: nextPlayer,
      statements: ['', '', '']
    })
  }

  const submitStatements = async () => {
    // Randomly choose which statement is the lie
    const lieIndex = Math.floor(Math.random() * 3)
    
    setLie(lieIndex)
    setVotes({})
    setTimer(20)
    setPhase('guessing')

    await syncGameState(gameId, {
      phase: 'guessing',
      players,
      scores,
      currentPlayer,
      statements,
      timer: 20,
      lie: lieIndex
    })
  }

  const submitGuess = async (guessIndex) => {
    const newVotes = { ...votes, [playerName]: guessIndex }
    setVotes(newVotes)

    await syncGameState(gameId, {
      phase: 'guessing',
      players,
      scores,
      currentPlayer,
      statements,
      votes: newVotes,
      timer,
      lie
    })
  }

  const revealAnswer = async () => {
    const correctGuessers = Object.entries(votes)
      .filter(([_, guess]) => guess === lie)
      .map(([voter]) => voter)

    const incorrect = Object.entries(votes)
      .filter(([_, guess]) => guess !== lie)
      .map(([voter]) => voter)

    const newScores = { ...scores }
    correctGuessers.forEach(voter => {
      newScores[voter] = (newScores[voter] || 0) + 5
    })

    setGuessedCorrectly(correctGuessers)
    setWrongGuessers(incorrect)
    setScores(newScores)
    setPhase('reveal')

    await syncGameState(gameId, {
      phase: 'reveal',
      players,
      scores: newScores,
      currentPlayer,
      statements,
      votes,
      lie,
      guessedCorrectly: correctGuessers,
      wrongGuessers: incorrect
    })
  }

  const giveChallenge = async () => {
    const availableChallenges = CHALLENGES.filter((_, i) => !usedChallenges.includes(i))
    if (availableChallenges.length === 0) {
      setUsedChallenges([])
      availableChallenges.push(...CHALLENGES)
    }

    const randomIdx = Math.floor(Math.random() * availableChallenges.length)
    const challenge = availableChallenges[randomIdx]
    const newUsed = [...usedChallenges, CHALLENGES.indexOf(challenge)]

    setUsedChallenges(newUsed)
    setCurrentChallenge(challenge)
    setPhase('challenge')

    await syncGameState(gameId, {
      phase: 'challenge',
      players,
      scores,
      currentChallenge: challenge
    })
  }

  if (!isHost && !playerName && phase === 'setup') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie" onExit={onExit}>
        <div className="setup-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && playerName && setPhase('waiting')}
          />
          <button 
            onClick={() => playerName && setPhase('waiting')}
            className="btn-primary"
          >
            Join Game
          </button>
        </div>
      </GameLayout>
    )
  }

  if (isHost && phase === 'setup') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie - Host" onExit={onExit}>
        <div className="host-setup">
          <h3>Add Players</h3>
          <div className="players-input">
            <input
              type="text"
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && playerName) {
                  addPlayer(playerName)
                  setPlayerName('')
                }
              }}
            />
            <button onClick={() => {
              addPlayer(playerName)
              setPlayerName('')
            }} className="btn-secondary">
              Add
            </button>
          </div>

          <div className="players-grid">
            {players.map((p) => (
              <div key={p.name} className="player-card">
                <div className="player-avatar">🎭</div>
                <div className="player-name">{p.name}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => startNextRound()}
            className="btn-primary"
            disabled={players.length < 2}
          >
            Start Game
          </button>
        </div>
      </GameLayout>
    )
  }

  if (phase === 'enter-statements') {
    const isCurrentPlayer = playerName === currentPlayer?.name

    if (!isCurrentPlayer && !isHost) {
      return (
        <GameLayout title="🤥 2 Truths & A Lie - Waiting" onExit={onExit}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', color: '#FFD700' }}>
              Waiting for {currentPlayer?.name} to enter statements...
            </p>
          </div>
        </GameLayout>
      )
    }

    if (isCurrentPlayer) {
      return (
        <GameLayout title="🤥 2 Truths & A Lie - Enter Statements" onExit={onExit}>
          <div className="statement-input">
            <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Enter 2 truths and 1 lie:</p>
            {statements.map((stmt, idx) => (
              <textarea
                key={idx}
                placeholder={`Statement ${idx + 1}`}
                value={stmt}
                onChange={(e) => {
                  const newStmt = [...statements]
                  newStmt[idx] = e.target.value
                  setStatements(newStmt)
                }}
              />
            ))}

            <button
              onClick={submitStatements}
              className="btn-primary"
              disabled={statements.some(s => !s)}
            >
              Ready to be Guessed
            </button>
          </div>
        </GameLayout>
      )
    }

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Host" onExit={onExit}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#FFD700' }}>
            Waiting for {currentPlayer?.name} to enter statements...
          </p>
        </div>
      </GameLayout>
    )
  }

  if (phase === 'guessing') {
    const isCurrentPlayer = playerName === currentPlayer?.name

    if (isCurrentPlayer) {
      return (
        <GameLayout title="🤥 2 Truths & A Lie - Guessing" onExit={onExit}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <p style={{ color: '#AAA', marginBottom: '2rem' }}>
              You're sitting out this round!
            </p>
          </div>
        </GameLayout>
      )
    }

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Guessing" onExit={onExit}>
        <div style={{ maxWidth: '600px' }}>
          <p style={{ color: '#FFD700', textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Which is the lie? ({timer}s)
          </p>

          <div className="statements-display">
            {statements.map((stmt, idx) => (
              <div
                key={idx}
                onClick={() => submitGuess(idx)}
                className={`statement-card ${votes[playerName] === idx ? 'selected' : ''}`}
              >
                {stmt}
              </div>
            ))}
          </div>

          {votes[playerName] !== undefined && (
            <p style={{ color: '#27AE60', textAlign: 'center', fontWeight: 'bold' }}>
              ✓ Your vote: Statement {votes[playerName] + 1}
            </p>
          )}
        </div>
      </GameLayout>
    )
  }

  if (phase === 'reveal') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie - The Lie Was..." onExit={onExit}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#E74C3C' }}>
              The Lie: Statement {lie + 1}
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#fff', margin: '1rem 0' }}>
              "{statements[lie]}"
            </p>
          </div>

          <div className="statements-display">
            {statements.map((stmt, idx) => (
              <div
                key={idx}
                style={{
                  background: idx === lie ? '#E74C3C' : '#27AE60',
                  border: 'none'
                }}
                className="statement-card"
              >
                {stmt}
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {idx === lie ? '🤥 LIE' : '✓ TRUTH'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px' }}>
            <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>Guessed Correctly: {guessedCorrectly.length}</h4>
            {guessedCorrectly.map(name => (
              <p key={name} style={{ color: '#27AE60' }}>🎉 {name} +5</p>
            ))}
          </div>

          {wrongGuessers.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px' }}>
              <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>Got it Wrong:</h4>
              {wrongGuessers.map(name => (
                <p key={name} style={{ color: '#E74C3C' }}>
                  {name} (Challenge!)
                </p>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a2a3a', borderRadius: '8px' }}>
            <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>Scores</h4>
            {Object.entries(scores)
              .sort(([,a], [,b]) => b - a)
              .map(([name, score]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #444', color: '#fff' }}>
                  <span>{name}</span>
                  <span style={{ color: '#FFD700' }}>{score}</span>
                </div>
              ))}
          </div>

          {isHost && wrongGuessers.length > 0 && (
            <button onClick={giveChallenge} className="btn-primary">
              Give Challenge
            </button>
          )}

          {isHost && wrongGuessers.length === 0 && (
            <button onClick={startNextRound} className="btn-primary">
              Next Round
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  if (phase === 'challenge') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie - Challenge!" onExit={onExit}>
        <div className="challenge-display">
          <h3>🎯 Your Challenge:</h3>
          <p className="challenge-text">{currentChallenge}</p>
          {isHost && (
            <button onClick={startNextRound} className="btn-primary">
              Next Round
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  return null
}
