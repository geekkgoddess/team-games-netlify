import { useState, useEffect, useCallback } from 'react'
import { syncGameState } from '../api/gameApi'
import GameLayout from './components/GameLayout'
import './games.css'

const CLUES = [
  "always early to meetings",
  "coffee junkie",
  "quiet but deadly",
  "forever on mute",
  "camera always off",
  "types in all caps",
  "loves the off mute button",
  "says 'thank you' 100 times",
  "uses too many emojis",
  "forget to unmute",
  "always has a cat on camera",
  "talks over everyone",
  "loves the whiteboard",
  "forgot to turn off share screen",
  "background always changes",
  "favorite snack is instant ramen",
  "claims 'you're on mute'",
  "always asks 'can everyone hear me'",
  "professional background",
  "chaotic background"
]

const AVATARS = [
  '🎭', '🦸', '🧑‍🚀', '🐱', '🐹', '🦊', '🦖', '🐙', '🦉', '🐢',
  '🦄', '🧙', '🎪', '🚀', '⚡', '🎸', '🐺', '🦅', '🐉', '🧛'
]

export default function GuessTheCoworker({ gameId, isHost, onExit }) {
  const [phase, setPhase] = useState('setup') // setup, playing, voting, reveal, results
  const [players, setPlayers] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [clues, setClues] = useState([])
  const [currentClueIdx, setCurrentClueIdx] = useState(0)
  const [scores, setScores] = useState({})
  const [votes, setVotes] = useState({})
  const [answer, setAnswer] = useState(null)
  const [guessedCorrectly, setGuessedCorrectly] = useState([])
  const [timer, setTimer] = useState(20)
  const [usedClues, setUsedClues] = useState([])

  // Host polling for state updates
  useEffect(() => {
    if (!isHost || phase === 'setup') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.scores) setScores(data.scores)
        if (data.votes) setVotes(data.votes)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost, phase])

  // Player polling for state updates
  useEffect(() => {
    if (isHost) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync-game-state?gameId=${gameId}`)
        const data = await response.json()
        if (data.players) setPlayers(data.players)
        if (data.phase) setPhase(data.phase)
        if (data.clues) setClues(data.clues)
        if (data.currentClueIdx !== undefined) setCurrentClueIdx(data.currentClueIdx)
        if (data.timer !== undefined) setTimer(data.timer)
        if (data.votes) setVotes(data.votes)
        if (data.answer) setAnswer(data.answer)
        if (data.scores) setScores(data.scores)
      } catch (e) {
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [gameId, isHost])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'voting' || timer <= 0) return

    const timeout = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(timeout)
  }, [timer, phase])

  const addPlayer = (name) => {
    if (!name || players.length >= AVATARS.length) return
    const newPlayers = [...players, {
      name,
      avatar: AVATARS[players.length % AVATARS.length]
    }]
    setPlayers(newPlayers)
    setScores({ ...scores, [name]: 0 })
  }

  const startRound = async () => {
    const availableClues = CLUES.filter((_, i) => !usedClues.includes(i))
    if (availableClues.length === 0) {
      // Reset clues
      setUsedClues([])
      availableClues.push(...CLUES)
    }

    const randomIdx = Math.floor(Math.random() * availableClues.length)
    const selectedClue = availableClues[randomIdx]
    const selectedPlayer = players[Math.floor(Math.random() * players.length)]

    const newPhase = 'playing'
    setPhase(newPhase)
    setAnswer(selectedPlayer)
    setClues([selectedClue])
    setVotes({})
    setTimer(20)

    await syncGameState(gameId, {
      phase: newPhase,
      players,
      scores,
      clues: [selectedClue],
      answer: selectedPlayer,
      votes: {},
      timer: 20
    })

    setPhase('voting')
    setTimer(20)
  }

  const submitVote = async (votedFor) => {
    const newVotes = { ...votes, [playerName]: votedFor }
    setVotes(newVotes)

    await syncGameState(gameId, {
      phase: 'voting',
      players,
      scores,
      clues,
      answer,
      votes: newVotes,
      timer
    })
  }

  const revealAnswer = async () => {
    const correctVoters = Object.entries(votes)
      .filter(([_, voted]) => voted === answer.name)
      .map(([voter]) => voter)

    const newScores = { ...scores }
    correctVoters.forEach(voter => {
      newScores[voter] = (newScores[voter] || 0) + 10
    })

    setGuessedCorrectly(correctVoters)
    setScores(newScores)
    setPhase('reveal')

    await syncGameState(gameId, {
      phase: 'reveal',
      players,
      scores: newScores,
      clues,
      answer,
      votes,
      guessedCorrectly: correctVoters,
      timer: 0
    })
  }

  const nextRound = async () => {
    setVotes({})
    setAnswer(null)
    setPhase('playing')
    startRound()
  }

  if (!isHost && !playerName && phase === 'setup') {
    return (
      <GameLayout title="👥 Guess the Coworker" onExit={onExit}>
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
      <GameLayout title="👥 Guess the Coworker - Host" onExit={onExit}>
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
                <div className="player-avatar">{p.avatar}</div>
                <div className="player-name">{p.name}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              startRound()
              setPhase('playing')
            }}
            className="btn-primary"
            disabled={players.length < 2}
          >
            Start Game
          </button>
        </div>
      </GameLayout>
    )
  }

  if (phase === 'playing' || phase === 'voting') {
    return (
      <GameLayout title="👥 Guess the Coworker" onExit={onExit}>
        <div className="game-container">
          {isHost && answer && (
            <div className="host-info">
              <p>🎯 Clue: <strong>{clues[0]}</strong></p>
              <p className="answer">Answer: {answer.avatar} {answer.name}</p>
              <div className="votes-display">
                <h4>Votes: {Object.keys(votes).length}/{players.length}</h4>
                {Object.entries(votes).map(([voter, votedFor]) => (
                  <div key={voter} className="vote">
                    {voter} → {votedFor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isHost && (
            <div className="player-view">
              <p className="clue-display">🔍 <strong>{clues[0]}</strong></p>
              <p className="timer">⏱️ {timer}s</p>

              <div className="avatars-grid">
                {players.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => submitVote(p.name)}
                    className={`avatar-btn ${votes[playerName] === p.name ? 'selected' : ''}`}
                  >
                    <div className="avatar">{p.avatar}</div>
                    <div className="name">{p.name}</div>
                  </button>
                ))}
              </div>

              {votes[playerName] && (
                <p className="voted">✓ Your vote: {votes[playerName]}</p>
              )}
            </div>
          )}

          {isHost && timer === 0 && (
            <button onClick={revealAnswer} className="btn-primary">
              Reveal Answer
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  if (phase === 'reveal') {
    return (
      <GameLayout title="👥 Guess the Coworker - Answer" onExit={onExit}>
        <div className="reveal-container">
          <h2>The Answer Was:</h2>
          <div className="big-avatar">{answer.avatar}</div>
          <h3>{answer.name}</h3>
          <p className="clue">"{clues[0]}"</p>

          <div className="guessers">
            <h4>✓ Got it Right: {guessedCorrectly.length}</h4>
            {guessedCorrectly.map(name => (
              <div key={name} className="guesser">🎉 {name} +10</div>
            ))}
          </div>

          <div className="leaderboard">
            <h4>Scores</h4>
            {Object.entries(scores)
              .sort(([,a], [,b]) => b - a)
              .map(([name, score]) => (
                <div key={name} className="score-row">
                  <span>{name}</span>
                  <span className="score">{score}</span>
                </div>
              ))}
          </div>

          {isHost && (
            <button onClick={nextRound} className="btn-primary">
              Next Clue
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  return null
}
