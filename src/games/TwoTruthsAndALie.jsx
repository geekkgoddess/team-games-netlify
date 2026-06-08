import { useState, useEffect } from 'react'
import { syncGameState } from '../api/gameApi'
import GameLayout from './components/GameLayout'
import presetData from '../presets/two-truths-and-a-lie.json'
import './games.css'

const DEFAULT_CHALLENGES = [
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

export default function TwoTruthsAndALie({ gameId, isHost, playerName, playerAvatar, gameCode, onExit, onGameEnd }) {
  const [phase, setPhase] = useState('waiting')
  const [players, setPlayers] = useState([])
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
  const [roundCount, setRoundCount] = useState(0)
  const [maxRounds] = useState(5)
  const [selectedLie, setSelectedLie] = useState(null)
  const [availableChallenges, setAvailableChallenges] = useState(DEFAULT_CHALLENGES)
  const [questionPreset, setQuestionPreset] = useState('default')
  const [challengeTimer, setChallengeTimer] = useState(0)
  const [playersWhoHaveBeenActive, setPlayersWhoHaveBeenActive] = useState([])

  // Register player when they join (non-host only)
  useEffect(() => {
    if (isHost || !playerName) return

    const registerPlayer = async () => {
      const myPlayer = { name: playerName, avatar: playerAvatar || '🎭' }
      try {
        await fetch('/api/sync-game-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            action: 'addPlayer',
            state: { newPlayer: myPlayer }
          })
        })
      } catch (e) {
        console.log('Registering player...')
      }
    }

    registerPlayer()
  }, [gameId, isHost, playerName, playerAvatar])

  // Host polling
  useEffect(() => {
    if (!isHost) return
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.scores) setScores(data.scores)
        if (data.votes !== undefined) setVotes(data.votes)
        if (data.phase && data.phase !== phase) setPhase(data.phase)
        if (data.currentPlayer) setCurrentPlayer(data.currentPlayer)
        if (data.statements) setStatements(data.statements)
        if (data.lie !== undefined) setLie(data.lie)
        if (data.questionPreset) setQuestionPreset(data.questionPreset)
        if (data.playersWhoHaveBeenActive) setPlayersWhoHaveBeenActive(data.playersWhoHaveBeenActive)
      } catch (e) { console.error('Polling error:', e) }
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
        // Don't overwrite statements while player is actively typing them in
        if (data.statements && phase !== 'enter-statements') setStatements(data.statements)
        if (data.votes !== undefined) setVotes(data.votes)
        if (data.lie !== undefined) setLie(data.lie)
        if (data.scores) setScores(data.scores)
        if (data.guessedCorrectly !== undefined) setGuessedCorrectly(data.guessedCorrectly)
        if (data.wrongGuessers !== undefined) setWrongGuessers(data.wrongGuessers)
        if (data.roundCount !== undefined) setRoundCount(data.roundCount)
        if (data.questionPreset) setQuestionPreset(data.questionPreset)
        if (data.timer !== undefined) setTimer(data.timer)
        if (data.currentChallenge) setCurrentChallenge(data.currentChallenge)
        if (data.challengeTimer !== undefined) setChallengeTimer(data.challengeTimer)
      } catch (e) { console.error('Polling error:', e) }
    }, 500)
    return () => clearInterval(interval)
  }, [gameId, isHost, phase])

  // Timer countdown and sync (host only)
  useEffect(() => {
    if (phase !== 'guessing' || !isHost || timer <= 0) return
    const timeout = setTimeout(async () => {
      const newTimer = timer - 1
      setTimer(newTimer)
      await syncGameState(gameId, {
        phase: 'guessing',
        currentPlayer,
        statements,
        lie,
        timer: newTimer,
        votes
      })
    }, 1000)
    return () => clearTimeout(timeout)
  }, [timer, phase, isHost])

  // Challenge timer countdown and auto-advance
  useEffect(() => {
    if (phase !== 'challenge' || !isHost || challengeTimer <= 0) return
    const timeout = setTimeout(async () => {
      const newChallengeTimer = challengeTimer - 1
      setChallengeTimer(newChallengeTimer)
      await syncGameState(gameId, { phase: 'challenge', currentChallenge, challengeTimer: newChallengeTimer })
    }, 1000)
    return () => clearTimeout(timeout)
  }, [challengeTimer, phase, isHost])

  // Auto-advance from challenge after timer ends
  useEffect(() => {
    if (phase === 'challenge' && isHost && challengeTimer === 0) {
      startNextRound()
    }
  }, [challengeTimer, phase, isHost])

  // Load challenges from preset
  useEffect(() => {
    const preset = presetData.find(p => p.id === questionPreset)
    if (preset?.challenges) {
      setAvailableChallenges(preset.challenges)
    } else {
      setAvailableChallenges(DEFAULT_CHALLENGES)
    }
  }, [questionPreset])

  const startNextRound = async () => {
    if (roundCount >= maxRounds) {
      setPhase('results')
      await syncGameState(gameId, { phase: 'results', scores })
      return
    }

    // Pick next active player (random, avoiding those who've already been active)
    const playersAvailable = players.filter((p, idx) => !playersWhoHaveBeenActive.includes(idx))
    let nextPlayerIdx

    if (playersAvailable.length === 0) {
      // All players have been active, reset and start over
      nextPlayerIdx = Math.floor(Math.random() * players.length)
      setPlayersWhoHaveBeenActive([nextPlayerIdx])
    } else {
      // Pick random from available players
      const randomIdx = Math.floor(Math.random() * playersAvailable.length)
      nextPlayerIdx = players.findIndex(p => p.name === playersAvailable[randomIdx].name)
      setPlayersWhoHaveBeenActive([...playersWhoHaveBeenActive, nextPlayerIdx])
    }

    const nextPlayer = players[nextPlayerIdx]

    setCurrentPlayer(nextPlayer)
    setStatements(['', '', ''])
    setLie(null)
    setVotes({})
    setGuessedCorrectly([])
    setWrongGuessers([])
    setSelectedLie(null)
    setPhase('enter-statements')
    setRoundCount(roundCount + 1)
    setChallengeTimer(0)

    await syncGameState(gameId, {
      phase: 'enter-statements',
      currentPlayer: nextPlayer,
      statements: ['', '', ''],
      lie: null,
      votes: {},
      guessedCorrectly: [],
      wrongGuessers: [],
      roundCount: roundCount + 1,
      playersWhoHaveBeenActive: playersWhoHaveBeenActive.includes(nextPlayerIdx) ? playersWhoHaveBeenActive : [...playersWhoHaveBeenActive, nextPlayerIdx]
    })
  }

  const submitStatements = async () => {
    if (selectedLie === null) return

    setLie(selectedLie)
    setVotes({})
    setTimer(20)
    setPhase('guessing')

    await syncGameState(gameId, {
      phase: 'guessing',
      statements,
      lie: selectedLie,
      timer: 20,
      votes: {}
    })
  }

  const submitGuess = async (guessIndex) => {
    const newVotes = { ...votes, [playerName]: guessIndex }
    setVotes(newVotes)

    try {
      await syncGameState(gameId, {
        phase: 'guessing',
        currentPlayer,
        statements,
        lie,
        timer,
        votes: newVotes
      })
    } catch (e) {
      console.error('Failed to submit guess:', e)
    }
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
      scores: newScores,
      guessedCorrectly: correctGuessers,
      wrongGuessers: incorrect
    })
  }

  const giveChallenge = async () => {
    const availableChallengesPool = availableChallenges.filter((_, i) => !usedChallenges.includes(i))
    let updatedPool = availableChallengesPool

    if (availableChallengesPool.length === 0) {
      setUsedChallenges([])
      updatedPool = availableChallenges
    }

    const randomIdx = Math.floor(Math.random() * updatedPool.length)
    const challenge = updatedPool[randomIdx]
    const newUsed = availableChallengesPool.length === 0 ? [availableChallenges.indexOf(challenge)] : [...usedChallenges, availableChallenges.indexOf(challenge)]

    setUsedChallenges(newUsed)
    setCurrentChallenge(challenge)
    setPhase('challenge')
    setChallengeTimer(10) // 10 second timer for challenge

    await syncGameState(gameId, {
      phase: 'challenge',
      currentChallenge: challenge,
      challengeTimer: 10,
      wrongGuessers
    })
  }

  // Setup phase — host lobby
  if (isHost && phase === 'waiting') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie - Host" onExit={onExit}>
        <div className="host-setup">
          <h3>Game Code: {gameCode}</h3>
          <p style={{ color: '#7a8ba8', marginBottom: '2rem' }}>Players will join automatically when they enter the code.</p>

          <div className="players-grid">
            {players.length === 0 ? (
              <p style={{ color: '#7a8ba8', gridColumn: '1/-1', textAlign: 'center' }}>Waiting for players to join...</p>
            ) : (
              players.map((p) => (
                <div key={p.name} className="player-card">
                  <div className="player-avatar">{p.avatar || '🎭'}</div>
                  <div className="player-name">{p.name}</div>
                </div>
              ))
            )}
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

  // Setup phase — players waiting for host to start
  if (phase === 'waiting') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie" onExit={onExit}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#e8edf5', marginBottom: '1rem' }}>
            Waiting for host to start the game...
          </p>
          <p style={{ color: '#7a8ba8' }}>Players: {players.length}</p>
        </div>
      </GameLayout>
    )
  }

  // Enter statements phase
  if (phase === 'enter-statements') {
    const isCurrentPlayer = playerName === currentPlayer?.name

    if (!isCurrentPlayer && !isHost) {
      return (
        <GameLayout title="🤥 2 Truths & A Lie - Waiting" onExit={onExit}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', color: '#00f5d4' }}>
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
            <p style={{ color: '#00f5d4', fontSize: '1.1rem', marginBottom: '1.5rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
              Enter 2 truths and 1 lie:
            </p>
            {statements.map((stmt, idx) => (
              <div key={idx}>
                <textarea
                  placeholder={`Statement ${idx + 1}`}
                  value={stmt}
                  onChange={(e) => {
                    const newStmt = [...statements]
                    newStmt[idx] = e.target.value
                    setStatements(newStmt)
                  }}
                />
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedLie(idx)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: selectedLie === idx ? '#7c3aed' : '#1e2d47',
                      border: selectedLie === idx ? '2px solid #00f5d4' : '1px solid #1e2d47',
                      color: '#e8edf5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      boxShadow: selectedLie === idx ? '0 0 20px rgba(124, 58, 237, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedLie !== idx) {
                        e.currentTarget.style.background = '#151f33'
                        e.currentTarget.style.borderColor = '#00f5d4'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLie !== idx) {
                        e.currentTarget.style.background = '#1e2d47'
                        e.currentTarget.style.borderColor = '#1e2d47'
                      }
                    }}
                  >
                    {selectedLie === idx ? '✓ This is the lie' : 'Mark as lie'}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={submitStatements}
              className="btn-primary"
              disabled={statements.some(s => !s) || selectedLie === null}
            >
              Ready to be Guessed
            </button>
          </div>
        </GameLayout>
      )
    }

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Host" onExit={onExit}>
        <div style={{ maxWidth: '600px' }}>
          <p style={{ fontSize: '1.2rem', color: '#00f5d4', textAlign: 'center', marginBottom: '2rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
            {currentPlayer?.name} is entering statements...
          </p>

          <div style={{ background: '#111827', borderRadius: '12px', padding: '1.5rem', border: '1px solid #1e2d47' }}>
            {statements.map((stmt, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#7a8ba8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Statement {idx + 1}:</p>
                <div style={{
                  background: '#0f1419',
                  border: '1px solid #1e2d47',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: stmt ? '#e8edf5' : '#5a6a8a',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  fontStyle: stmt ? 'normal' : 'italic'
                }}>
                  {stmt || '(waiting for input...)'}
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: '#7a8ba8', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            ⏳ Waiting for {currentPlayer?.name} to select which is the lie and click "Ready to be Guessed"
          </p>
        </div>
      </GameLayout>
    )
  }

  // Guessing phase
  if (phase === 'guessing') {
    const isCurrentPlayer = playerName === currentPlayer?.name

    if (isCurrentPlayer) {
      return (
        <GameLayout title="🤥 2 Truths & A Lie - Guessing" onExit={onExit}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <p style={{ color: '#7a8ba8', marginBottom: '2rem' }}>
              You're sitting out this round!
            </p>
          </div>
        </GameLayout>
      )
    }

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Guessing" onExit={onExit}>
        <div style={{ maxWidth: '600px' }}>
          <p style={{ color: '#00f5d4', textAlign: 'center', fontSize: '1.1rem', marginBottom: '2rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
            Which is the lie? ({timer}s)
          </p>

          <div className="statements-display">
            {statements.map((stmt, idx) => (
              <div
                key={idx}
                onClick={() => submitGuess(idx)}
                className={`statement-card ${votes[playerName] === idx ? 'selected' : ''}`}
                style={{ cursor: votes[playerName] !== undefined && votes[playerName] !== idx ? 'pointer' : 'pointer' }}
              >
                {stmt}
              </div>
            ))}
          </div>

          {votes[playerName] !== undefined ? (
            <div style={{ background: '#0f1419', border: '2px solid #00f5d4', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#00f5d4', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ✓ Vote Recorded
              </p>
              <p style={{ color: '#e8edf5' }}>
                Statement {votes[playerName] + 1}
              </p>
              <p style={{ color: '#7a8ba8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                (tap another to change)
              </p>
            </div>
          ) : (
            <p style={{ color: '#7a8ba8', textAlign: 'center', marginTop: '1rem' }}>
              Click a statement to vote
            </p>
          )}

          {isHost && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f1419', borderRadius: '8px', border: '1px solid #1e2d47', textAlign: 'center' }}>
              <p style={{ color: '#7a8ba8', marginBottom: '0.5rem' }}>
                Votes: {Object.keys(votes).length} / {players.length - 1}
              </p>
              {Object.keys(votes).length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {Object.entries(votes).map(([name]) => (
                    <p key={name} style={{ color: '#00f5d4', fontSize: '0.9rem' }}>✓ {name} voted</p>
                  ))}
                </div>
              )}
              {(timer === 0 || Object.keys(votes).length === players.length - 1) && (
                <button onClick={revealAnswer} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                  Reveal Answer
                </button>
              )}
            </div>
          )}
        </div>
      </GameLayout>
    )
  }

  // Reveal phase
  if (phase === 'reveal') {
    return (
      <GameLayout title="🤥 2 Truths & A Lie - The Lie Was..." onExit={onExit}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#f59e0b', marginBottom: '1rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
              The Lie: Statement {lie + 1}
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#e8edf5', margin: '1rem 0' }}>
              "{statements[lie]}"
            </p>
          </div>

          <div className="statements-display">
            {statements.map((stmt, idx) => (
              <div
                key={idx}
                style={{
                  background: idx === lie ? '#7c3aed' : '#111827',
                  border: idx === lie ? '2px solid #f59e0b' : '2px solid #1e2d47',
                  boxShadow: idx === lie ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                }}
                className="statement-card"
              >
                {stmt}
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: idx === lie ? '#f59e0b' : '#00f5d4' }}>
                  {idx === lie ? '🤥 LIE' : '✓ TRUTH'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f1419', borderRadius: '8px', border: '1px solid #1e2d47' }}>
            <h4 style={{ color: '#00f5d4', marginBottom: '1rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
              Guessed Correctly: {guessedCorrectly.length}
            </h4>
            {guessedCorrectly.map(name => (
              <p key={name} style={{ color: '#00f5d4' }}>🎉 {name} +5</p>
            ))}
          </div>

          {wrongGuessers.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#0f1419', borderRadius: '8px', border: '1px solid #1e2d47' }}>
              <h4 style={{ color: '#00f5d4', marginBottom: '1rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
                Got it Wrong (Challenge!):
              </h4>
              {wrongGuessers.map(name => (
                <p key={name} style={{ color: '#f59e0b' }}>
                  {name}
                </p>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f1419', borderRadius: '8px', border: '1px solid #1e2d47' }}>
            <h4 style={{ color: '#00f5d4', marginBottom: '1rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>Scores</h4>
            {Object.entries(scores)
              .sort(([,a], [,b]) => b - a)
              .map(([name, score]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #1e2d47', color: '#e8edf5' }}>
                  <span>{name}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{score}</span>
                </div>
              ))}
          </div>

          {isHost && wrongGuessers.length > 0 && (
            <button onClick={giveChallenge} className="btn-primary" style={{ marginTop: '2rem' }}>
              Give Challenge
            </button>
          )}

          {isHost && wrongGuessers.length === 0 && (
            <button onClick={startNextRound} className="btn-primary" style={{ marginTop: '2rem' }}>
              {roundCount >= maxRounds ? 'View Results' : 'Next Round'}
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  // Challenge phase
  if (phase === 'challenge') {
    const isChallenged = wrongGuessers.includes(playerName)

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Challenge!" onExit={onExit}>
        <div className="challenge-display">
          <div style={{ maxWidth: '600px' }}>
            {isChallenged ? (
              <div>
                <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>🎯 YOUR Challenge:</h3>
                <p className="challenge-text" style={{ background: '#0f1419', border: '2px solid #f59e0b', borderRadius: '8px', padding: '1.5rem', color: '#e8edf5', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                  {currentChallenge}
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#00f5d4', marginBottom: '1rem' }}>Challenge Time!</h3>
                <div style={{ background: '#0f1419', borderRadius: '8px', padding: '1.5rem', border: '1px solid #1e2d47', marginBottom: '1.5rem' }}>
                  {wrongGuessers.map(name => (
                    <p key={name} style={{ color: '#f59e0b', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {name}
                    </p>
                  ))}
                  <p style={{ color: '#7a8ba8', fontSize: '0.9rem', marginTop: '1rem' }}>are completing their challenge...</p>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', color: '#7a8ba8', fontSize: '0.9rem' }}>
              Next round in {challengeTimer}s...
            </div>
          </div>
        </div>
      </GameLayout>
    )
  }

  // Results phase
  if (phase === 'results') {
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a)
    const medals = ['🥇', '🥈', '🥉']

    return (
      <GameLayout title="🤥 2 Truths & A Lie - Final Results!" onExit={onExit}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h2 style={{ color: '#00f5d4', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
            Game Over!
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            {sortedScores.map(([name, score], idx) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: '#111827',
                  borderRadius: '12px',
                  marginBottom: '0.75rem',
                  border: idx === 0 ? '2px solid #f59e0b' : '1px solid #1e2d47',
                  boxShadow: idx === 0 ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{medals[idx] || '🎭'}</span>
                  <span style={{ color: '#e8edf5', fontSize: '1.1rem', fontWeight: 600 }}>{name}</span>
                </div>
                <span style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold' }}>{score}</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button onClick={onGameEnd} className="btn-primary">
              Return to Menu
            </button>
          )}
          {!isHost && (
            <p style={{ color: '#7a8ba8' }}>Waiting for host to return to menu...</p>
          )}
        </div>
      </GameLayout>
    )
  }

  return null
}
