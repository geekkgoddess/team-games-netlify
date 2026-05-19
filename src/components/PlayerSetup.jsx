import React, { useState } from 'react';
import { avatars } from '../utils/gameUtils';
import '../styles/PlayerSetup.css';

export default function PlayerSetup({ onReady, onBack }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [error, setError] = useState('');

  const handleReady = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!selectedAvatar) {
      setError('Please select an avatar');
      return;
    }
    onReady(name.trim(), selectedAvatar);
  };

  return (
    <div className="player-setup-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="player-setup">
        <h1>👤 Set Up Your Player</h1>

        <div className="setup-form">
          <label>What's your name?</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength="20"
            autoFocus
          />

          <label>Pick your avatar:</label>
          <div className="avatar-grid">
            {avatars.map((avatar, idx) => (
              <button
                key={idx}
                className={`avatar-btn ${selectedAvatar === avatar ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAvatar(avatar);
                  setError('');
                }}
                title={avatar}
              >
                {avatar}
              </button>
            ))}
          </div>

          {error && <p className="error">{error}</p>}

          <button 
            className="ready-btn" 
            onClick={handleReady}
            disabled={!name.trim() || !selectedAvatar}
          >
            Ready to Play! →
          </button>
        </div>

        {selectedAvatar && name && (
          <div className="preview">
            <p>Your player:</p>
            <div className="preview-player">
              <span className="preview-avatar">{selectedAvatar}</span>
              <span className="preview-name">{name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
