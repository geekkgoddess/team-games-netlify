import React, { useState } from 'react';
import { formatCode } from '../utils/gameUtils';
import '../styles/GameCodeEntry.css';

export default function GameCodeEntry({ onCodeSubmit, onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedCode = formatCode(code);
    
    if (formattedCode.length !== 6) {
      setError('Game code must be 6 characters');
      return;
    }

    onCodeSubmit(formattedCode);
  };

  return (
    <div className="code-entry-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      <div className="code-entry">
        <h1>🎮 Enter Game Code</h1>
        <p>Ask the host for the game code</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="E.g., ABC123"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            maxLength="6"
            autoFocus
            className="code-input"
          />
          
          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit-btn">
            Join Game →
          </button>
        </form>

        <div className="code-display">
          Entered: <span className="display-code">{code || '------'}</span>
        </div>
      </div>
    </div>
  );
}
