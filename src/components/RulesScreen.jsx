import React from 'react';
import '../styles/RulesScreen.css';

export default function RulesScreen({ gameTitle, rules, onAgree, onBack }) {
  return (
    <div className="rules-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      <div className="rules-screen">
        <h1>{gameTitle}</h1>
        
        <div className="rules-content">
          <h2>📖 How to Play</h2>
          
          <div className="rules-list">
            {rules.map((rule, idx) => (
              <div key={idx} className="rule-item">
                <span className="rule-number">{idx + 1}</span>
                <span className="rule-text">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="agree-btn" onClick={onAgree}>
          Agree & Continue →
        </button>
      </div>
    </div>
  );
}
