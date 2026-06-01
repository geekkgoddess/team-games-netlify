# Team Game Lounge — Claude Code Context

## Project Overview
Web-based interactive team-building game platform for remote and in-person teams.
- **Host's browser = source of truth** (React state)
- **Netlify Functions** = in-memory relay (`sync-game-state.js`)
- Players poll `/api/sync-game-state?gameId=X` every 500ms
- No external database — firewall-safe

## URLs
- Game app: `team-games-app.netlify.app`
- Landing page: `team-games.netlify.app`
- GitHub: `github.com/geekkgoddess/team-games-netlify`
- Local Mac folder: `~/team-games-netlify/`

## Deployment
- **Game app** (`team-games-app`): GitHub → auto-deploy, build `npm run build`, publish `dist`, functions `netlify/functions`
- **Landing page** (`team-games`): Drag-and-drop only (not GitHub) — `netlify.toml` in root overrides build settings
- **To update game app**: `git add . && git commit -m "msg" && git push origin main`
- **Vite version**: MUST stay at `^7.3.3` — vite 8.x breaks `@vitejs/plugin-react`

## File Structure
```
~/team-games-netlify/
├── index.html                     ← React entry point
├── landing/index.html             ← Landing page (drag-drop to Netlify)
├── src/
│   ├── App.jsx                    ← Main router/state machine
│   ├── api/gameApi.js
│   ├── components/
│   │   ├── RoleSelector.jsx       ← Working ✅
│   │   ├── GameCodeEntry.jsx      ← Working ✅
│   │   ├── RulesScreen.jsx        ← Working ✅
│   │   ├── PlayerSetup.jsx        ← Working ✅
│   │   ├── GameRating.jsx         ← Working ✅
│   │   └── HostLobby.jsx          ← Working ✅
│   ├── styles/                    ← CSS for components
│   └── games/
│       ├── GuessTheCoworker.jsx   ← FULLY WORKING ✅ (reference this)
│       ├── TwoTruthsAndALie.jsx   ← NEEDS WORK ⚠️
│       ├── TeamsAgainstHumanity.jsx ← NEEDS WORK ⚠️
│       ├── games.css              ← Shared game styles
│       └── components/GameLayout.jsx
└── netlify/functions/
    └── sync-game-state.js         ← WORKING relay (addPlayer merges)
```

## Game Flow
```
Host:   role → host-menu → host-lobby → game
Player: role → code-entry → rules → player-setup → game → rating
```

## Design Theme (MUST MATCH)
The landing page (`landing/index.html`) uses this exact palette — **all game UI must match**:
- **Background**: `#080c14` (near-black, dark navy)
- **Surface cards**: `#111827`
- **Borders**: `#1e2d47`
- **Primary accent**: `#00f5d4` (teal/cyan)
- **Secondary accent**: `#7c3aed` (purple)
- **Amber accent**: `#f59e0b` (for scores/points)
- **Text primary**: `#e8edf5`
- **Text muted**: `#7a8ba8`
- **Gradient CTA**: `linear-gradient(135deg, #00f5d4, #7c3aed)`
- **Card hover**: `#151f33`
- **Font**: `DM Sans` for body, `Unbounded` for headings/titles
- **Border radius**: `12px`–`20px` for cards, `8px`–`10px` for buttons
- **Glow effects**: `box-shadow: 0 0 20px rgba(0,245,212,0.18)` on accented elements

The **current** `games.css` and `GameLayout.jsx` use an older dark theme (gold `#FFD700` accents, `#1a1a1a` background). **Update `games.css` and all inline styles in both game files to match the landing page palette above.**

## ✅ GuessTheCoworker — WORKING (DO NOT BREAK)
This game works fully. Use it as the reference pattern for architecture.
- Players self-register (no host entering names)
- `addPlayer` action in sync-game-state.js MERGES players (don't overwrite)
- Host sees vote count but answer hidden during voting
- Instant visual feedback on vote click
- Auto-retry up to 3x on network lag
- 4-second leaderboard pause between rounds
- 5 rounds max then final 🥇🥈🥉 results

## ⚠️ TwoTruthsAndALie — NEEDS FIXES

### What it has
- State machine: `setup → enter-statements → guessing → reveal → challenge → results`
- Polling logic (host + player)
- CHALLENGES array, timer countdown
- Rendering for most phases (functional but basic/unstyled)

### What's broken / missing
1. **UI/UX completely unstyled** — raw divs with inline styles, no CSS classes
2. **`startNextRound` has a bug** — player index calculation is wrong (will go to wrong player)
3. **Player self-registration not wired up** — still uses old `addPlayer`/`playerName` state pattern instead of reading players from sync state like GuessTheCoworker does
4. **`submitStatements` function** — needs to push statements + lie index to sync state so all players can see them
5. **`giveChallenge`** — needs to push challenge to sync state so all players see it
6. **`submitGuess`** — needs to submit vote via sync state, not just local state
7. **Missing final results screen** — no end-of-game leaderboard with 🥇🥈🥉
8. **The lie selection UI** — when entering statements, the active player needs to tap which statement is the lie (currently `lie` state is set but never collected from the player's input)

### Fix goals
- Full working game loop with proper sync state
- Style to match landing page theme
- Player self-registration (read from sync state, not local name entry)
- Smooth reveal animation when the lie is shown
- Final results screen after all players have had a turn

## ⚠️ TeamsAgainstHumanity — NEEDS FIXES

### What it has
- State machine: `setup → playing → judging → results`
- PROMPTS array (20 work-themed prompts, great content)
- Polling logic
- Rendering for most phases

### What's broken / missing
1. **UI/UX completely unstyled** — inline styles only, no CSS classes from games.css
2. **Player self-registration not wired up** — same issue as 2 Truths
3. **`startRound` function** — needs to push phase + prompt to sync state
4. **`submitAnswer`** — submits to sync state but `submissions` object may not merge properly
5. **`awardPoints`** — needs to update scores in sync state, not just local state
6. **`nextRound`** — needs to push new prompt + clear submissions to sync state
7. **Missing final results screen** — no end-of-game leaderboard
8. **Answer input** — `onKeyPress` is deprecated; use `onKeyDown`. Also the button's `previousElementSibling` pattern is fragile; use a controlled input with useState
9. **Submission display** — currently shows author names during judging (should be anonymous until host picks)

### Fix goals
- Full working game loop via sync state
- Style to match landing page theme
- Anonymous submissions during judging phase (reveal author AFTER host picks)
- Controlled input (useState) for answer field
- Final results screen after N rounds

## sync-game-state.js Architecture
The relay stores state in-memory keyed by `gameId`. Supported actions:
- `createGame` — initializes game
- `addPlayer` — MERGES player into players array (does NOT overwrite)
- `updateState` — merges arbitrary fields into game state
- `getState` — returns current state (GET requests)

**Important**: When pushing state from host, use `action: 'updateState'` with the fields you want to change. Both games should follow GuessTheCoworker's pattern for how it pushes round state.

## Key Implementation Pattern (from GuessTheCoworker)
```js
// Push state from host to all players
await fetch('/api/sync-game-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameId,
    action: 'updateState',
    phase: 'guessing',
    // ... other state fields
  })
})
```

## CSS Classes Available in games.css
- `.game-layout`, `.game-header-bar`, `.game-title`, `.game-content`
- `.btn-primary`, `.btn-exit`
- `.statement-card`, `.statement-card.selected` (2 Truths)
- `.challenge-display`, `.challenge-text` (2 Truths)
- `.statement-input` (2 Truths)
- `.players-grid`, `.player-card`, `.player-avatar`, `.player-name`
- `.leaderboard-container`, `.leaderboard-row`

**UPDATE all of these to use the landing page color palette** (teal/purple, not gold).

## Task Summary
1. **Update `games.css`** — retheme all classes to match landing page (teal `#00f5d4`, purple `#7c3aed`, dark `#080c14` backgrounds)
2. **Fix `TwoTruthsAndALie.jsx`** — full working sync-state loop, lie selection UI, final results, landing theme
3. **Fix `TeamsAgainstHumanity.jsx`** — full working sync-state loop, anonymous submissions, controlled input, final results, landing theme
4. **Do NOT touch** `GuessTheCoworker.jsx`, `App.jsx`, `sync-game-state.js`, or any component files

## Git Workflow
```bash
cd ~/team-games-netlify
git add .
git commit -m "Fix TwoTruths and TAH UI/UX, retheme to landing page palette"
git push origin main
```
