import React from 'react';
import '../styles/RoleSelector.css';

export default function RoleSelector({ onSelectRole }) {
  return (
    <div className="role-selector-container">
      <div className="role-selector">
        <h1>🎮 TEAM GAMES</h1>
        <p>Select your role to begin</p>
        
        <div className="role-buttons">
          <button 
            className="role-btn host-btn"
            onClick={() => onSelectRole('host')}
          >
            <span className="role-icon">🎤</span>
            <span className="role-title">I'm the HOST</span>
            <span className="role-desc">Manage the game, share screen</span>
          </button>

          <button 
            className="role-btn player-btn"
            onClick={() => onSelectRole('player')}
          >
            <span className="role-icon">👤</span>
            <span className="role-title">I'm a PLAYER</span>
            <span className="role-desc">Enter game code, play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
