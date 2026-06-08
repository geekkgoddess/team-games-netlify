import { useState, useEffect } from 'react'
import { syncGameState } from '../api/gameApi'
import GameLayout from './components/GameLayout'
import presetData from '../presets/teams-against-humanity.json'
import { playCorrectChime, playApplause } from '../utils/soundEffects'
import './games.css'

const DEFAULT_PROMPTS = [
  "What's the most awkward thing to say on a zoom call?",
  "I just realized my manager is ___.",
  "The best thing about working from home is ___.",
  "When the internet goes out, I ___.",
  "The worst thing on my Teams background is ___.",
  "I should probably stop ___.",
  "My coworkers think I ___ all day.",
  "The best meeting excuse is ___.",
  "I always forget to ___ before calling someone.",
  "If I had to describe myself in 3 words: ___.",
  "The worst part of stand-ups is ___.",
  "My Slack status should really say ___.",
  "I've never actually ___ at work.",
  "The craziest thing that happened on a call was ___.",
  "When someone unmutes unexpectedly, I ___.",
  "I spend way too much time ___ at work.",
  "The most relatable Slack emoji is ___.",
  "If I were honest, I ___ during meetings.",
  "The thing I miss most about the office is ___.",
  "I got caught ___ on camera once.",
]

export default function TeamsAgainstHumanity({ gameId, isHost, playerName, playerAvatar, gameCode, onExit, onGameEnd }) {
  const [phase, setPhase] = useState('waiting')
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [submissions, setSubmissions] = useState({})
  const [answered, setAnswered] = useState([])
  const [round, setRound] = useState(0)
  const [usedPrompts, setUsedPrompts] = useState([])
  const [answerInput, setAnswerInput] = useState('')
  const [submissionsList, setSubmissionsList] = useState([])
  const [maxRounds] = useState(5)
  const [availablePrompts, setAvailablePrompts] = useState(DEFAULT_PROMPTS)
  const [questionPreset, setQuestionPreset] = useState('default')

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
        if (data.submissions !== undefined) {
          setSubmissions(data.submissions)
          setSubmissionsList(Object.entries(data.submissions).map(([key, answer]) => ({ id: key, answer })))
        }
        if (data.answered !== undefined) setAnswered(data.answered)
        if (data.round !== undefined) setRound(data.round)
        if (data.questionPreset) setQuestionPreset(data.questionPreset)
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
        if (data.currentPrompt) setCurrentPrompt(data.currentPrompt)
        if (data.submissions !== undefined) {
          setSubmissions(data.submissions)
          setSubmissionsList(Object.entries(data.submissions).map(([key, answer]) => ({ id: key, answer })))
        }
        if (data.answered !== undefined) setAnswered(data.answered)
        if (data.scores) setScores(data.scores)
        if (data.round !== undefined) setRound(data.round)
        if (data.questionPreset) setQuestionPreset(data.questionPreset)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost])

  useEffect(() => {
    const preset = presetData.find(p => p.id === questionPreset)
    if (preset?.prompts) {
      setAvailablePrompts(preset.prompts)
    } else {
      setAvailablePrompts(DEFAULT_PROMPTS)
    }
  }, [questionPreset])

  const getNextPrompt = () => {
    const availablePromptsPool = availablePrompts.filter((_, i) => !usedPrompts.includes(i))
    if (availablePromptsPool.length === 0) {
      setUsedPrompts([])
      availablePromptsPool.push(...availablePrompts)
    }

    const randomIdx = Math.floor(Math.random() * availablePromptsPool.length)
    const prompt = availablePromptsPool[randomIdx]
    const newUsed = [...usedPrompts, availablePrompts.indexOf(prompt)]
    setUsedPrompts(newUsed)
    return prompt
  }

  const startRound = async () => {
    const prompt = getNextPrompt()
    const newRound = round + 1

    setCurrentPrompt(prompt)
    setSubmissions({})
    setSubmissionsList([])
    setAnswered([])
    setRound(newRound)
    setPhase('playing')
    setAnswerInput('')

    await syncGameState(gameId, {
      phase: 'playing',
      currentPrompt: prompt,
      submissions: {},
      answered: [],
      round: newRound,
      scores
    })
  }

  const submitAnswer = async (answer) => {
    if (!answer.trim()) return

    const newSubmissions = { ...submissions, [playerName]: answer }
    const newAnswered = [...answered, playerName]

    setSubmissions(newSubmissions)
    setAnswered(newAnswered)
    setAnswerInput('')

    await syncGameState(gameId, {
      submissions: newSubmissions,
      answered: newAnswered
    })
  }

  const startJudging = async () => {
    setPhase('judging')

    await syncGameState(gameId, {
      phase: 'judging'
    })
  }

  const awardPoints = async (submitterName, points = 10) => {
    const newScores = { ...scores }
    newScores[submitterName] = (newScores[submitterName] || 0) + points

    setScores(newScores)

    // Play sound effect when someone wins a round
    playCorrectChime()
    setTimeout(() => playApplause(), 600)

    await syncGameState(gameId, {
      scores: newScores
    })
  }

  const nextRound = async () => {
    if (round >= maxRounds) {
      setPhase('results')
      await syncGameState(gameId, { phase: 'results', scores })
      return
    }

    // Ensure submissions are cleared before starting the next round
    const prompt = getNextPrompt()
    const newRound = round + 1

    setCurrentPrompt(prompt)
    setSubmissions({})
    setSubmissionsList([])
    setAnswered([])
    setRound(newRound)
    setPhase('playing')
    setAnswerInput('')

    await syncGameState(gameId, {
      phase: 'playing',
      currentPrompt: prompt,
      submissions: {},
      answered: [],
      round: newRound,
      scores
    })
  }

  // Setup phase — host lobby
  if (isHost && phase === 'waiting') {
    return (
      <GameLayout title="🎭 Teams Against Humanity - Host" onExit={onExit}>
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
            onClick={() => startRound()}
            className="btn-primary"
            disabled={players.length < 2}
          >
            Start Game
          </button>
        </div>
      </GameLayout>
    )
  }

  // Setup/Waiting phase — players waiting for host
  if (phase === 'waiting') {
    return (
      <GameLayout title="🎭 Teams Against Humanity" onExit={onExit}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#e8edf5', marginBottom: '1rem' }}>
            Waiting for host to start the game...
          </p>
          <p style={{ color: '#7a8ba8' }}>Players: {players.length}</p>
        </div>
      </GameLayout>
    )
  }

  // Playing phase (submitting answers)
  if (phase === 'playing') {
    return (
      <GameLayout title="🎭 Teams Against Humanity - Playing" onExit={onExit}>
        <div style={{ maxWidth: '800px' }}>
          {isHost && (
            <div className="host-info">
              <p style={{ fontSize: '1.3rem', marginBottom: '1rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
                🎯 {currentPrompt}
              </p>
              <p style={{ color: '#7a8ba8' }}>
                {answered.length}/{players.length} submitted
              </p>
              <div style={{ marginTop: '1rem' }}>
                {answered.map(name => (
                  <div key={name} style={{ color: '#00f5d4', padding: '0.25rem', fontWeight: 600 }}>✓ {name}</div>
                ))}
              </div>

              {answered.length === players.length && (
                <button onClick={startJudging} className="btn-primary" style={{ marginTop: '2rem' }}>
                  Start Judging
                </button>
              )}
            </div>
          )}

          {!isHost && !answered.includes(playerName) && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ fontSize: '1.3rem', color: '#00f5d4', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
                {currentPrompt}
              </p>

              <div>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && answerInput.trim()) {
                      submitAnswer(answerInput)
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '1rem',
                    background: '#111827',
                    border: '2px solid #00f5d4',
                    borderRadius: '8px',
                    color: '#e8edf5',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 212, 0.18)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  autoFocus
                />
                <button
                  onClick={() => submitAnswer(answerInput)}
                  className="btn-primary"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          {answered.includes(playerName) && (
            <p style={{ textAlign: 'center', color: '#00f5d4', fontSize: '1.1rem', fontWeight: 'bold' }}>
              ✓ Answer submitted! Waiting for others...
            </p>
          )}
        </div>
      </GameLayout>
    )
  }

  // Judging phase
  if (phase === 'judging') {
    return (
      <GameLayout title="🎭 Teams Against Humanity - Judging" onExit={onExit}>
        <div style={{ maxWidth: '800px' }}>
          {isHost ? (
            <>
              <p style={{ fontSize: '1.3rem', color: '#00f5d4', marginBottom: '2rem', textAlign: 'center', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
                {currentPrompt}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {submissionsList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#111827',
                      border: '2px solid #1e2d47',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 10px rgba(0, 245, 212, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)'
                      e.currentTarget.style.borderColor = '#00f5d4'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 212, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = '#1e2d47'
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 245, 212, 0.08)'
                    }}
                    onClick={() => awardPoints(item.id)}
                  >
                    <p style={{ fontSize: '1rem', color: '#e8edf5', marginBottom: '0.5rem', minHeight: '50px', display: 'flex', alignItems: 'center' }}>
                      "{item.answer}"
                    </p>
                    <button style={{ width: '100%', marginTop: '0.5rem' }} className="btn-primary">
                      👑 Award Points
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: '#0f1419', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #1e2d47' }}>
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

              <button onClick={nextRound} className="btn-primary">
                {round >= maxRounds ? 'View Results' : 'Next Round'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', color: '#00f5d4', marginBottom: '2rem', fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>
                {currentPrompt}
              </p>
              <p style={{ color: '#7a8ba8', marginTop: '2rem', marginBottom: '2rem' }}>
                Waiting for host to judge...
              </p>

              <div style={{ background: '#0f1419', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e2d47' }}>
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
            </div>
          )}
        </div>
      </GameLayout>
    )
  }

  // Results phase
  if (phase === 'results') {
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a)
    const medals = ['🥇', '🥈', '🥉']

    return (
      <GameLayout title="🎭 Teams Against Humanity - Final Results!" onExit={onExit}>
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
