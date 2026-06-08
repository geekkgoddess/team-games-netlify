# Leaderboard Management Guide

## Overview

The leaderboard data is now stored in `src/data/leaderboard.json` instead of browser localStorage.

**Why this matters:**
- ✅ Changes persist across ALL devices (Mac, work computer, phone)
- ✅ No more losing data when browser cache is cleared
- ✅ Full version history via Git
- ✅ Can edit from anywhere

---

## How It Works

### **Before (Broken)**
```
Admin Panel → localStorage → Only works on THIS browser
```

### **After (Fixed)**
```
Admin Panel → leaderboard.json → Works on ALL devices
    ↓
Apply Changes
    ↓
Export JSON or Edit on GitHub
    ↓
Commit to GitHub
    ↓
Netlify auto-deploys
    ↓
Landing page loads from deployed file
```

---

## Two Ways to Update

### **Method 1: Admin Panel Export (Easiest)**

1. **On Landing Page:**
   - Click "⚙️ Admin" button
   - Enter password: `admin1937`
   - Edit champion and players

2. **Click "✅ Apply Changes"**
   - Data updates on page instantly
   - Also saved to localStorage (backup)

3. **Click "📥 Export for GitHub"**
   - `leaderboard.json` downloads to your computer
   - Open the file to verify the data looks correct

4. **Commit to GitHub:**
   ```bash
   cd ~/team-games-netlify
   # Move the downloaded file
   cp ~/Downloads/leaderboard.json src/data/leaderboard.json
   
   git add src/data/leaderboard.json
   git commit -m "Update leaderboard: New scores"
   git push origin main
   ```

5. **Done!** Netlify deploys in 30 seconds
   - Landing page now shows updated data
   - Works on ANY device

---

### **Method 2: Direct GitHub Edit (Faster)**

1. **In Admin Panel:**
   - Make your changes
   - Click "✅ Apply Changes"

2. **Click "📝 Edit on GitHub"**
   - Opens GitHub editor in new tab
   - Already navigated to `src/data/leaderboard.json`

3. **Edit the JSON Directly**
   ```json
   {
     "champion": {
       "name": "Alice",
       "avatar": "🦸",
       "game": "Guess the Coworker",
       "wins": 6,
       "score": 350
     },
     "topPlayers": [
       {
         "rank": 1,
         "avatar": "🦸",
         "name": "Alice",
         "game": "Coworker",
         "points": 350
       }
       // ... more players
     ]
   }
   ```

4. **Commit in GitHub**
   - Write message: "Update leaderboard"
   - Click "Commit changes"

5. **Done!** Auto-deploys in 30 seconds

---

## JSON Structure

```json
{
  "champion": {
    "name": "Joanna H.",          // Champion's name
    "avatar": "🦸",                // Their emoji
    "game": "Guess the Coworker",  // Which game they won
    "wins": 5,                     // Number of wins
    "score": 320                   // Total points
  },
  
  "topPlayers": [
    {
      "rank": 1,                   // Position in ranking
      "avatar": "🦸",              // Their emoji
      "name": "Joanna H.",         // Their name
      "game": "Coworker",          // Their main game
      "points": 320                // Their total points
    },
    // ... up to 5 more players
  ],
  
  "metadata": {
    "lastUpdated": "2026-06-08",   // Date of last update
    "instructions": "..."           // Notes for yourself
  }
}
```

---

## Common Tasks

### **Add a New Top Player**

1. **In GitHub** or **Admin Panel**, add to `topPlayers` array:
   ```json
   {
     "rank": 6,
     "avatar": "🎭",
     "name": "New Player",
     "game": "2 Truths",
     "points": 150
   }
   ```

2. **Re-rank the list** (make sure rank numbers are 1, 2, 3, etc.)

3. **Commit to GitHub** → Auto-deploys

### **Update Champion (New Winner)**

```json
"champion": {
  "name": "Bob",
  "avatar": "🐱",
  "game": "2 Truths & A Lie",
  "wins": 7,
  "score": 450
}
```

### **Remove a Player**

Delete their entry from `topPlayers` array

### **Update Scores**

Just change the `points` value for any player:
```json
"points": 500  // Updated score
```

---

## Important Notes

### **Always Keep the Structure**
- ✅ Must have `champion` object
- ✅ Must have `topPlayers` array
- ✅ Each player must have: rank, avatar, name, game, points
- ✅ Valid JSON format (use jsonlint.com if unsure)

### **Rank Numbers**
- Should be: 1, 2, 3, 4, 5 (in order)
- Edit the rank if you add/remove players

### **Avatar Emoji**
- Can be any emoji you like
- Keep it to 1 character for consistency

---

## Troubleshooting

**Q: I edited the leaderboard but changes don't appear on landing page**
- A: Wait 30 seconds for Netlify to deploy
- A: Hard-refresh your browser (Cmd+Shift+R on Mac)
- A: Check that you committed to GitHub (not just saved locally)

**Q: The JSON won't validate/save on GitHub**
- A: Use jsonlint.com to check syntax
- A: Make sure all quotes are matching
- A: No trailing commas after last item

**Q: I want to keep backup of old leaderboards**
- A: GitHub keeps all versions! Check "History" tab in GitHub

**Q: Can I edit from my work computer?**
- A: Yes! Use "📝 Edit on GitHub" button
- A: Or edit directly in GitHub web interface
- A: Changes auto-deploy to landing page

---

## Workflow Comparison

### **Old Way (Broken)**
```
Change data in browser → Save to localStorage
    ↓
Only works on THAT browser
    ↓
Go to different computer → data gone
    ↓
❌ Have to re-enter everything
```

### **New Way (Fixed)**
```
Change data in admin panel
    ↓
Click "Export for GitHub" or "Edit on GitHub"
    ↓
Commit to GitHub
    ↓
Netlify auto-deploys
    ↓
✅ Works on ALL devices, ANY browser
```

---

## Integration with Team Roster

You now have TWO files in `src/data/`:

- **`team-roster.json`** - Who's on the team + their Guess the Coworker clues
- **`leaderboard.json`** - Scores and rankings

Both:
- ✅ Edit in GitHub directly
- ✅ Auto-deploy when committed
- ✅ Work on any device
- ✅ Have full version history

---

## Next Steps (Future)

We can add:
- ✅ Auto-sync game results to leaderboard
- ✅ Admin panel to track game histories
- ✅ Performance analytics
- ✅ Seasonal/monthly leaderboards

For now, manual updates via GitHub keep it simple and firewall-safe! 🎯
