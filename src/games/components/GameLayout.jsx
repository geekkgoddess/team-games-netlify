export default function GameLayout({ title, children, onExit }) {
  return (
    <div className="game-layout">
      <div className="game-header-bar">
        <button onClick={onExit} className="btn-exit">← Exit Game</button>
        <h1 className="game-title">{title}</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      <div className="game-content">
        {children}
      </div>
    </div>
  )
}
