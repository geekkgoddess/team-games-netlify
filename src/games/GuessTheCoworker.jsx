import { useState, useEffect } from 'react'
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
  "forgets to unmute",
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

export default function GuessTheCoworker({ gameId, isHost, playerName, playerAvatar, gameCode, onExit, onGameEnd }) {
  const [phase, setPhase] = useState('waiting') // waiting, playing, voting, reveal, leaderboard-pause, results
  const [players, setPlayers] = useState([])
  const [clues, setClues] = useState([])
  const [scores, setScores] = useState({})
  const [votes, setVotes] = useState({})
  const [answer, setAnswer] = useState(null)
  const [guessedCorrectly, setGuessedCorrectly] = useState([])
  const [timer, setTimer] = useState(20)
  const [usedClues, setUsedClues] = useState([])
  const [roundCount, setRoundCount] = useState(0)
  const [maxRounds] = useState(5)
  const [leaderboardPauseTimer, setLeaderboardPauseTimer] = useState(0)
  const [pendingVote, setPendingVote] = useState(null)
  const [voteSending, setVoteSending] = useState(false)
  const [voteConfirmed, setVoteConfirmed] = useState(false)

  // Register player when they join (non-host only)
  useEffect(() => {
    if (isHost || !playerName) return

    const registerPlayer = async () => {
      const myPlayer = { name: playerName, avatar: playerAvatar || '🎭' }
      try {
        // FIX: Use addPlayer action so server MERGES instead of overwrites
        // This prevents players disappearing when multiple people join at once
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
        if (data.votes) setVotes(data.votes)
        if (data.phase && data.phase !== phase) setPhase(data.phase)
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
        if (data.clues) setClues(data.clues)
        if (data.timer !== undefined) setTimer(data.timer)
        if (data.votes) setVotes(data.votes)
        if (data.answer) setAnswer(data.answer)
        if (data.scores) setScores(data.scores)
      } catch (e) { console.error('Polling error:', e) }
    }, 500)
    return () => clearInterval(interval)
  }, [gameId, isHost])

  // Voting timer
  useEffect(() => {
    if (phase !== 'voting' || !isHost || timer <= 0) return
    const timeout = setTimeout(() => {
      const newTimer = timer - 1
      setTimer(newTimer)
      syncGameState(gameId, { phase: 'voting', players, scores, clues, answer, votes, timer: newTimer })
    }, 1000)
    return () => clearTimeout(timeout)
  }, [timer, phase, isHost])

  // Leaderboard pause countdown
  useEffect(() => {
    if (phase !== 'leaderboard-pause' || leaderboardPauseTimer <= 0) return
    const timeout = setTimeout(() => setLeaderboardPauseTimer(leaderboardPauseTimer - 1), 1000)
    return () => clearTimeout(timeout)
  }, [leaderboardPauseTimer, phase])

  // Auto-advance after leaderboard pause
  useEffect(() => {
    if (phase === 'leaderboard-pause' && leaderboardPauseTimer === 0 && isHost) {
      if (roundCount >= maxRounds) {
        endGame()
      } else {
        startRound()
      }
    }
  }, [leaderboardPauseTimer, phase])

  const startRound = async () => {
    const availableClues = CLUES.filter((_, i) => !usedClues.includes(i))
    const pool = availableClues.length === 0 ? CLUES : availableClues

    const randomIdx = Math.floor(Math.random() * pool.length)
    const selectedClue = pool[randomIdx]
    const selectedPlayer = players[Math.floor(Math.random() * players.length)]

    setUsedClues([...usedClues, CLUES.indexOf(selectedClue)])
    setAnswer(selectedPlayer)
    setClues([selectedClue])
    setVotes({})
    setTimer(20)
    setRoundCount(prev => prev + 1)
    setPhase('voting')

    await syncGameState(gameId, {
      phase: 'voting',
      players,
      scores,
      clues: [selectedClue],
      answer: selectedPlayer,
      votes: {},
      timer: 20
    })
  }

  const submitVote = async (votedFor) => {
    // Don't re-send if already sending the same vote
    if (voteSending && pendingVote === votedFor) return

    // Show selection INSTANTLY — don't wait for server
    setPendingVote(votedFor)
    setVoteSending(true)
    setVoteConfirmed(false)

    const newVotes = { ...votes, [playerName]: votedFor }
    setVotes(newVotes)

    // Retry up to 3 times if network is slow
    let success = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await syncGameState(gameId, {
          phase: 'voting',
          players,
          scores,
          clues,
          answer,
          votes: newVotes,
          timer
        })
        success = true
        break
      } catch (e) {
        console.log('Vote attempt ' + attempt + ' failed, retrying...')
        await new Promise(r => setTimeout(r, 300))
      }
    }

    setVoteSending(false)
    setVoteConfirmed(success)
  }

  const revealAnswer = async () => {
    const correctVoters = Object.entries(votes)
      .filter(([_, voted]) => voted === answer?.name)
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

  const goToLeaderboard = async () => {
    setPhase('leaderboard-pause')
    setLeaderboardPauseTimer(4)

    await syncGameState(gameId, {
      phase: 'leaderboard-pause',
      players,
      scores,
      clues,
      answer,
      votes,
      timer: 0
    })
  }

  const endGame = async () => {
    setPhase('results')
    await syncGameState(gameId, { phase: 'results', players, scores })
  }

  // --- HOST: Waiting for players ---
  if (isHost && phase === 'waiting') {
    return (
      <GameLayout title="👥 Guess the Coworker - Host" onExit={onExit}>
        <div className="host-setup">
          <h3>Game Code: <span style={{ color: '#ffd700', letterSpacing: '4px' }}>{gameCode}</span></h3>
          <p style={{ color: '#aaa' }}>Waiting for players to join...</p>

          <div className="players-grid" style={{ margin: '20px 0' }}>
            {players.length === 0 ? (
              <p style={{ color: '#666' }}>⏳ No players yet</p>
            ) : (
              players.map((p) => (
                <div key={p.name} className="player-card">
                  <div className="player-avatar">{p.avatar}</div>
                  <div className="player-name">{p.name}</div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={startRound}
            className="btn-primary"
            disabled={players.length < 1}
          >
            {players.length < 1 ? 'Waiting for players...' : `Start Game (${players.length} players) →`}
          </button>

          <p style={{ marginTop: '12px' }}>
            <button onClick={startRound} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
              Start without players (solo test)
            </button>
          </p>
        </div>
      </GameLayout>
    )
  }

  // --- PLAYER: Waiting for host to start ---
  if (!isHost && phase === 'waiting') {
    return (
      <GameLayout title="👥 Guess the Coworker" onExit={onExit}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>{playerAvatar || '🎭'}</div>
          <h2>Hi {playerName}! 👋</h2>
          <p style={{ color: '#aaa', marginTop: '12px' }}>⏳ Waiting for the host to start the game...</p>
        </div>
      </GameLayout>
    )
  }

  // --- VOTING PHASE ---
  if (phase === 'voting') {
    return (
      <GameLayout title="👥 Guess the Coworker" onExit={onExit}>
        <div className="game-container">

          {/* HOST VIEW: sees vote count but NOT the answer */}
          {isHost && (
            <div className="host-info">
              <p>🎯 Clue: <strong>{clues[0]}</strong></p>
              <h3 style={{ color: '#ffd700', margin: '16px 0' }}>
                Votes: {Object.keys(votes).length} / {players.length}
              </h3>
              {Object.keys(votes).map(voter => (
                <div key={voter} className="vote">✓ {voter} voted</div>
              ))}
              <p style={{ color: '#888', marginTop: '12px', fontSize: '14px' }}>⏱️ {timer}s remaining</p>
              {(timer === 0 || Object.keys(votes).length === players.length) && (
                <button onClick={revealAnswer} className="btn-primary" style={{ marginTop: '20px' }}>
                  Reveal Answer →
                </button>
              )}
            </div>
          )}

          {/* PLAYER VIEW: sees clue + avatar buttons to vote */}
          {!isHost && (
            <div className="player-view">
              <p className="clue-display">🔍 <strong>{clues[0]}</strong></p>
              <p className="timer">⏱️ {timer}s</p>

              <div className="avatars-grid">
                {players.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => submitVote(p.name)}
                    className={`avatar-btn ${pendingVote === p.name ? 'selected' : ''} ${voteSending && pendingVote !== p.name ? 'dimmed' : ''}`}
                  >
                    <div className="avatar">{p.avatar}</div>
                    <div className="name">{p.name}</div>
                    {pendingVote === p.name && voteSending && (
                      <div className="vote-status sending">Sending...</div>
                    )}
                    {pendingVote === p.name && voteConfirmed && (
                      <div className="vote-status confirmed">✓ Voted</div>
                    )}
                  </button>
                ))}
              </div>

              {pendingVote && (
                <p className="voted">
                  {voteSending ? '⏳ Sending vote...' : voteConfirmed ? '✅ Vote confirmed!' : '⚠️ Retrying...'}
                  &nbsp;— {pendingVote}
                  {voteConfirmed && <span style={{color:'#aaa', fontSize:'13px'}}> (tap another to change)</span>}
                </p>
              )}
            </div>
          )}
        </div>
      </GameLayout>
    )
  }

  // --- REVEAL PHASE ---
  if (phase === 'reveal') {
    return (
      <GameLayout title="👥 Guess the Coworker - Answer" onExit={onExit}>
        <div className="reveal-container">
          <h2>The Answer Was:</h2>
          <div className="big-avatar">{answer?.avatar}</div>
          <h3>{answer?.name}</h3>
          <p className="clue">"{clues[0]}"</p>

          <div className="guessers">
            <h4>✓ Got it Right: {guessedCorrectly.length}</h4>
            {guessedCorrectly.map(name => (
              <div key={name} className="guesser">🎉 {name} +10</div>
            ))}
          </div>

          <div className="leaderboard">
            <h4>Scores</h4>
            {Object.entries(scores).sort(([,a],[,b]) => b - a).map(([name, score]) => (
              <div key={name} className="score-row">
                <span>{name}</span>
                <span className="score">{score}</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button onClick={goToLeaderboard} className="btn-primary">
              {roundCount >= maxRounds ? 'See Final Results →' : 'Next Round →'}
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  // --- LEADERBOARD PAUSE ---
  if (phase === 'leaderboard-pause') {
    return (
      <GameLayout title="👥 Leaderboard" onExit={onExit}>
        <div className="reveal-container">
          <h2>Round {roundCount} Done!</h2>
          {isHost && <p style={{ color: '#ffd700' }}>Next round in {leaderboardPauseTimer}s...</p>}
          <div className="leaderboard">
            {Object.entries(scores).sort(([,a],[,b]) => b - a).map(([name, score], idx) => (
              <div key={name} className="score-row">
                <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}.`} {name}</span>
                <span className="score">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </GameLayout>
    )
  }

  // --- FINAL RESULTS ---
  if (phase === 'results') {
    const finalLeaderboard = Object.entries(scores)
      .sort(([,a],[,b]) => b - a)
      .map(([name, points]) => ({ name, points, avatar: players.find(p => p.name === name)?.avatar || '🎭' }))

    return (
      <GameLayout title="👥 Game Over!" onExit={onExit}>
        <div className="reveal-container">
          <h2>🎉 Final Results!</h2>
          {finalLeaderboard.slice(0, 3).map((player, idx) => (
            <div key={idx} className="score-row" style={{ fontSize: '1.2rem', margin: '8px 0' }}>
              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {player.avatar} {player.name}</span>
              <span className="score">{player.points} pts</span>
            </div>
          ))}
          {isHost && (
            <button onClick={() => onGameEnd && onGameEnd(finalLeaderboard)} className="btn-primary" style={{ marginTop: '24px' }}>
              Finish & Rate Game →
            </button>
          )}
        </div>
      </GameLayout>
    )
  }

  return null
}
