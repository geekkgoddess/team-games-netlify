# Team Games - Netlify Edition

Real-time multiplayer team games designed for remote Teams meetings with 5-20 people.

## 🎮 Games Included

1. **Guess the Coworker** 👥
   - Clue-based guessing game
   - Host shares screen with prompt
   - Players guess who based on clue
   - Real-time voting and scoring

2. **2 Truths & A Lie** 🤥
   - One player enters 3 statements (2 true, 1 lie)
   - Others guess which is the lie
   - Wrong guessers face challenges
   - Leaderboard tracking

3. **Teams Against Humanity** 🎭
   - Match game prompts with absurd answers
   - Host judges submissions
   - Award points to favorites
   - Real-time leaderboard

---

## 🏗️ Architecture

```
Frontend (React)
    ↓
Netlify Functions (API)
    ↓
In-Memory Game Store (via polling)
```

**How it works:**
- **Host's browser** keeps game state locally + polls API to broadcast state
- **Players' browsers** poll API every 500ms to receive updates
- **Netlify Functions** act as real-time relay (no database needed)
- All data syncs through `/api/sync-game-state` endpoint

---

## 🚀 Deployment Instructions

### 1. Prerequisites

- GitHub account
- Netlify account (your existing one)
- Git installed locally
- Node.js 14+ installed

### 2. Prepare for Deployment

```bash
# Navigate to project directory
cd team-games-netlify

# Install dependencies
npm install

# Test locally (optional)
npm run dev
# Visit http://localhost:5173
```

### 3. Deploy to Netlify

**Option A: Direct Git Deploy (Recommended)**

1. Create a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Team games"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/team-games-netlify.git
   git push -u origin main
   ```

2. Go to **Netlify** → **New site from Git**
   - Select GitHub
   - Choose `team-games-netlify` repo
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click **Deploy**

Netlify will:
- ✅ Auto-build on every push
- ✅ Deploy Netlify Functions automatically
- ✅ Provide you with a `.netlify.app` domain
- ✅ Update live within seconds

**Option B: Netlify CLI (Faster)**

```bash
# Install Netlify CLI globally (one time)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 4. Your Game URL

After deployment, you'll get a URL like:
```
https://your-site-name.netlify.app
```

Share this in your Teams chat!

---

## 🎯 How to Use

### **Host Setup**

1. Open game URL in your browser
2. Choose a game
3. Add all player names
4. **Share your screen** in Teams
5. Click "Start Game"
6. Host's screen shows:
   - Current prompt/clue
   - Player submissions in real-time
   - Vote counts
   - Leaderboard

### **Players**

1. Open the **same game URL** in their browser
2. Enter their name
3. **DO NOT share their screen** (watch host's shared screen)
4. When prompted, submit their answer/vote
5. Their device updates in real-time as host advances rounds
6. See scores update instantly

---

## 🔄 Real-Time Sync Flow

```
Host Screen:
  1. Host has game open → polls every 500ms
  2. Host updates game state locally
  3. Host's poll sends state to /api/sync-game-state
  4. Function stores state in memory

Player Screen:
  1. Player has game open → polls every 500ms
  2. Player's poll fetches from /api/sync-game-state
  3. Player sees updated game (clues, votes, scores, etc.)
  4. Player submits answer → updates local state
  5. Player's next poll syncs their submission to host

All synchronized within 500ms!
```

---

## 📋 Netlify Functions Explained

### `/api/sync-game-state`
**Core function that keeps everyone synced**

**POST** (Host broadcasting state):
```javascript
{
  gameId: "abc123",
  state: {
    phase: "guessing",
    players: [...],
    currentPrompt: "Who is it?",
    submissions: {...},
    votes: {...},
    scores: {...}
  }
}
```

**GET** (Players fetching state):
```javascript
GET /api/sync-game-state?gameId=abc123
→ Returns latest state from memory
```

### Other Functions
- `/api/create-game` - Initialize game session
- `/api/submit-answer` - Acknowledge answer submission
- `/api/submit-vote` - Acknowledge vote submission
- `/api/award-points` - Acknowledge points awarded
- `/api/end-game` - Clean up game session

---

## 🎮 Game Flow Examples

### Guess the Coworker

```
PHASE 1: HOST SETUP
Host: "Add players: Jamie, Alex, Morgan"
Host: Click "Start Game"

PHASE 2: HOST SCREEN (Shared)
Host sees:
  - Clue: "always early to meetings"
  - Answer: Jamie (hidden from players)
  - Vote count: 1/3 submitted

Player 1 (Jamie): Sees clue, clicks "Alex"
Player 2 (Alex): Sees clue, clicks "Morgan"
Player 3 (Morgan): Sees clue, clicks "Jamie"

PHASE 3: REVEAL
Host sees all votes, clicks "Reveal Answer"
All screens show: "✓ Jamie was correct!"
Scores update instantly

PHASE 4: NEXT CLUE
Host clicks "Next Clue" → Game repeats
```

### 2 Truths & A Lie

```
PHASE 1: HOST SETUP
Host adds players

PHASE 2: ENTER STATEMENTS
Current player enters:
  1. "I've been to 12 countries"
  2. "I speak 3 languages"
  3. "I once ate a whole pizza alone" (THE LIE)

Click "Ready to be Guessed"

PHASE 3: GUESSING (20 seconds)
All other players see 3 statements
Must click one they think is the lie

PHASE 4: REVEAL
Host sees votes, clicks to reveal
Players who guessed correctly: +5 points
Players who guessed wrong: Face a challenge

PHASE 5: CHALLENGE
Wrong guessers see: "Do 20 pushups"
They complete on camera
Host clicks "Next Round"
```

### Teams Against Humanity

```
PHASE 1: HOST SETUP
Host adds players

PHASE 2: PLAYING
Host's screen shows: "What's the most awkward thing to say on zoom?"
Players see prompt, type answer, click Submit
Host sees: "2/4 submitted"

PHASE 3: JUDGING
Host sees answer cards:
  - Card 1: "forgetting to unmute" by Jamie
  - Card 2: "my cat on keyboard" by Alex
  - Card 3: "help I'm muted" by Morgan
  - Card 4: "can you hear me now?" by Sam

Host reads aloud, clicks favorite card
That player gets +10 points
Scores update live

Host clicks "Next Round"
```

---

## ⚙️ Configuration

### Default Game Settings

Edit these values in game files:

**Guess the Coworker** (`src/games/GuessTheCoworker.jsx`):
- Timer: 20 seconds
- Points per correct guess: 10
- Max players: 20 (AVATARS length)

**2 Truths & A Lie** (`src/games/TwoTruthsAndALie.jsx`):
- Timer: 20 seconds
- Points per correct guess: 5
- Challenges: 17 different challenges

**Teams Against Humanity** (`src/games/TeamsAgainstHumanity.jsx`):
- Points per vote: 10
- Prompts: 20 included

### To Add More Content:

1. **More Guesses for Guess the Coworker:**
   - Edit `CLUES` array in `GuessTheCoworker.jsx`

2. **More Challenges for 2 Truths:**
   - Edit `CHALLENGES` array in `TwoTruthsAndALie.jsx`

3. **More Prompts for TAH:**
   - Edit `PROMPTS` array in `TeamsAgainstHumanity.jsx`

---

## 🔐 Security & Firewall

**Why this works through your firewall:**
- ✅ Single domain (your Netlify site)
- ✅ No external API calls
- ✅ No CDN resources
- ✅ No third-party scripts
- ✅ Everything self-contained

**Data privacy:**
- ✅ All game data stays in-memory during game
- ✅ No persistent database
- ✅ No logs of submissions
- ✅ Data cleared when function cold-starts
- ✅ 2-hour auto-cleanup

---

## 📱 Browser Requirements

- ✅ Chrome/Edge/Firefox (desktop & mobile)
- ✅ Safari (iOS & macOS)
- ✅ No plugins needed
- ✅ No additional permissions

---

## 🐛 Troubleshooting

### **Games aren't syncing**
- Check host is polling (game should say "syncing...")
- Refresh player browser
- Check Netlify Functions are deployed (Netlify dashboard → Functions)

### **Host sees votes, players don't**
- Players might not have joined via correct URL
- Try refreshing player browser
- Ensure both on same `gameId`

### **Buttons not responding**
- Check browser console for errors
- Verify Netlify Functions deployed
- Test API endpoint: `/api/sync-game-state?gameId=test`

### **Firewall blocking**
- If you can open the Netlify URL, functions should work
- Check network tab in browser DevTools
- Contact IT if Netlify domain is blocked

---

## 🚀 Next Steps

1. **Deploy to Netlify** (follow steps above)
2. **Test with your team** (5-20 people)
3. **Share game URL** in Teams chat
4. **Run games!**

---

## 📞 Support

If games aren't working:

1. Check browser console (F12) for errors
2. Verify Netlify Functions are deployed
3. Try refreshing page
4. Check if firewall is blocking Netlify domain

---

## 🎉 Have Fun!

These games are designed to build team connection and have fun. The real-time sync means everyone stays engaged and can see results instantly.

Good luck! 🍀
