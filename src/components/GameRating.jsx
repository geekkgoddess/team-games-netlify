import React, { useState } from 'react';
import { playApplause } from '../utils/soundEffects';
import '../styles/GameRating.css';

export default function GameRating({ gameTitle, leaderboard, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  React.useEffect(() => {
    playApplause();
  }, []);

  const handleSubmit = () => {
    onSubmit({
      rating: rating || null,
      feedback: feedback.trim()
    });
  };

  return (
    <div className="rating-container">
      <div className="rating-screen">
        <h1>🎉 GAME OVER!</h1>

        <div className="final-leaderboard">
          <h2>Final Scores</h2>
          <div className="leaderboard-list">
            {leaderboard.slice(0, 3).map((player, idx) => (
              <div key={idx} className="leaderboard-item">
                <span className="position">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span className="player-info">
                  <span className="player-avatar">{player.avatar}</span>
                  <span className="player-name">{player.name}</span>
                </span>
                <span className="player-score">{player.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rating-section">
          <h2>How was {gameTitle}?</h2>
          
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                ⭐
              </button>
            ))}
          </div>

          <textarea
            className="feedback-input"
            placeholder="Optional: What could we improve?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength="200"
          />

          <div className="button-group">
            <button className="submit-btn" onClick={handleSubmit}>
              Submit Rating
            </button>
            <button className="skip-btn" onClick={onSkip}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
