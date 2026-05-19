import { useState, useEffect } from 'react'
import { syncGameState } from '../api/gameApi'
import GameLayout from './components/GameLayout'
import './games.css'

const PROMPTS = [
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

export default function TeamsAgainstHumanity({ gameId, isHost, onExit }) {
  const [phase, setPhase] = useState('setup') // setup, playing, judging, results
  const [players, setPlayers] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [scores, setScores] = useState({})
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [submissions, setSubmissions] = useState({})
  const [answered, setAnswered] = useState([])
  const [round, setRound] = useState(0)
  const [usedPrompts, setUsedPrompts] = useState([])

  // Host polling
  useEffect(() => {
    if (!isHost || phase === 'setup') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.scores) setScores(data.scores)
        if (data.submissions) setSubmissions(data.submissions)
        if (data.answered) setAnswered(data.answered)
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
        if (data.submissions) setSubmissions(data.submissions)
        if (data.answered) setAnswered(data.answered)
        if (data.scores) setScores(data.scores)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost])

  const addPlayer = (name) => {
    if (!name || players.find(p => p.name === name)) return
    const newPlayers = [...players, { name }]
    setPlayers(newPlayers)
    setScores({ ...scores, [name]: 0 })
  }

  const getNextPrompt = () => {
    const availablePrompts = PROMPTS.filter((_, i) => !usedPrompts.includes(i))
    if (availablePrompts.length === 0) {
      setUsedPrompts([])
      availablePrompts.push(...PROMPTS)
    }

    const randomIdx = Math.floor(Math.random() * availablePrompts.length)
    const prompt = availablePrompts[randomIdx]
    const newUsed = [...usedPrompts, PROMPTS.indexOf(prompt)]
    setUsedPrompts(newUsed)
    return prompt
  }

  const startRound = async () => {
    const prompt = getNextPrompt()
    const newRound = round + 1

    setCurrentPrompt(prompt)
    setSubmissions({})
    setAnswered([])
    setRound(newRound)
    setPhase('playing')

    await syncGameState(gameId, {
      phase: 'playing',
      players,
      scores,
      currentPrompt: prompt,
      submissions: {},
      answered: [],
      round: newRound
    })
  }

  const submitAnswer = async (answer) => {
    const newSubmissions = { ...submissions, [playerName]: answer }
    const newAnswered = [...answered, playerName]

    setSubmissions(newSubmissions)
    setAnswered(newAnswered)

    await syncGameState(gameId, {
      phase: 'playing',
      players,
      scores,
      currentPrompt,
      submissions: newSubmissions,
      answered: newAnswered
    })
  }

  const startJudging = async () => {
    setPhase('judging')

    await syncGameState(gameId, {
      phase: 'judging',
      players,
      scores,
      currentPrompt,
      submissions,
      answered
    })
  }

  const awardPoints = async (playerName, points = 10) => {
    const newScores = { ...scores }
    newScores[playerName] = (newScores[playerName] || 0) + points

    setScores(newScores)

    await syncGameState(gameId, {
      phase: 'judging',
      players,
      scores: newScores,
      currentPrompt,
      submissions,
      answered
    })
  }

  const nextRound = async () => {
    startRound()
  }

  if (!isHost && !playerName && phase === 'setup') {
    return (
      <GameLayout title="🎭 Teams Against Humanity" onExit={onExit}>
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
      <GameLayout title="🎭 Teams Against Humanity - Host" onExit={onExit}>
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

  if (phase === 'playing') {
    return (
      <GameLayout title="🎭 Teams Against Humanity - Playing" onExit={onExit}>
        <div style={{ maxWidth: '800px' }}>
          {isHost && (
            <div className="host-info">
              <p style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
                🎯 {currentPrompt}
              </p>
              <p style={{ color: '#AAA' }}>
                {answered.length}/{players.length} submitted
              </p>
              <div style={{ marginTop: '1rem' }}>
                {answered.map(name => (
                  <div key={name} style={{ color: '#27AE60', padding: '0.25rem' }}>✓ {name}</div>
                ))}
              </div>

              {answered.length === players.length && (
                <button onClick={startJudging} className="btn-primary">
                  Start Judging
                </button>
              )}
            </div>
          )}

          {!isHost && !answered.includes(playerName) && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ fontSize: '1.3rem', color: '#FFD700', marginBottom: '2rem', textAlign: 'center' }}>
                {currentPrompt}
              </p>

              <div>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      submitAnswer(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  style={{ width: '100%', padding: '12px', marginBottom: '1rem' }}
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    if (input.value) {
                      submitAnswer(input.value)
                      input.value = ''
                    }
                  }}
                  className="btn-primary"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          {answered.includes(playerName) && (
            <p style={{ textAlign: 'center', color: '#27AE60', fontSize: '1.1rem', fontWeight: 'bold' }}>
              ✓ Answer submitted! Waiting for others...
            </p>
          )}
        </div>
      </GameLayout>
    )
  }

  if (phase === 'judging') {
    return (
      <GameLayout title="🎭 Teams Against Humanity - Judging" onExit={onExit}>
        <div style={{ maxWidth: '800px' }}>
          {isHost ? (
            <>
              <p style={{ fontSize: '1.3rem', color: '#FFD700', marginBottom: '2rem', textAlign: 'center' }}>
                {currentPrompt}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {Object.entries(submissions).map(([author, answer]) => (
                  <div
                    key={author}
                    style={{
                      background: '#2a2a2a',
                      border: '2px solid #FFD700',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)'
                      e.currentTarget.style.borderColor = '#FFE700'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = '#FFD700'
                    }}
                    onClick={() => awardPoints(author)}
                  >
                    <p style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.5rem', minHeight: '50px', display: 'flex', alignItems: 'center' }}>
                      "{answer}"
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#AAA' }}>by {author}</p>
                    <button style={{ marginTop: '0.5rem', width: '100%' }} className="btn-primary">
                      👑 Award Points
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: '#1a2a3a', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
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

              <button onClick={nextRound} className="btn-primary">
                Next Round
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', color: '#FFD700' }}>
                {currentPrompt}
              </p>
              <p style={{ color: '#AAA', marginTop: '2rem' }}>
                Waiting for host to judge...
              </p>

              <div style={{ marginTop: '2rem', background: '#1a2a3a', padding: '1.5rem', borderRadius: '8px' }}>
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
            </div>
          )}
        </div>
      </GameLayout>
    )
  }

  return null
}
