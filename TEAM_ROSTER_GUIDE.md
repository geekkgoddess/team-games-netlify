# Team Roster Management Guide

## Overview

The team roster is stored in `src/data/team-roster.json` and controls the personalized clues used in **Guess the Coworker**.

**Key Points:**
- ✅ Editable directly in GitHub (no special tools needed)
- ✅ Auto-deploys when you commit/push
- ✅ Changes are live within 30 seconds
- ✅ Works from any device (phone, work computer, etc.)
- ✅ Supports growing teams with rotating interns/contractors

---

## How to Update Team Roster

### **Method 1: Edit in GitHub (Web Browser)**

This is the easiest method - you can do it from ANY device, even your work computer.

**Steps:**

1. **Go to GitHub**
   - Open: `https://github.com/geekkgoddess/team-games-netlify`
   - Navigate to: `src/data/team-roster.json`

2. **Click the Edit Button** (pencil icon)

3. **Edit the JSON**
   ```json
   {
     "teamMembers": [
       {
         "id": "member-001",
         "name": "Alice",
         "avatar": "🦸",
         "status": "active",
         "guessTheCoworker": {
           "clues": [
             "always forgets to unmute",
             "loves coffee more than sleep",
             "background always changes"
           ]
         }
       }
     ]
   }
   ```

4. **Commit Changes**
   - At the bottom, write a message like: `"Update team roster: Add new intern clues"`
   - Click **Commit changes**

5. **Done!** Netlify auto-deploys within 30 seconds

---

### **Method 2: Edit Locally on Your Mac**

For bulk updates or if you prefer your text editor.

**Steps:**

1. **Open the file in VS Code**
   ```bash
   code ~/team-games-netlify/src/data/team-roster.json
   ```

2. **Edit the team members**

3. **Commit and push**
   ```bash
   cd ~/team-games-netlify
   git add src/data/team-roster.json
   git commit -m "Update team roster: Add new members"
   git push origin main
   ```

4. **Done!** Check Netlify deployment status in a few seconds

---

## JSON Structure Explained

```json
{
  "teamMembers": [
    {
      "id": "member-001",              // Unique ID (use member-001, member-002, etc.)
      "name": "Alice",                 // Player's display name (must match when they join)
      "avatar": "🦸",                  // Emoji avatar
      "status": "active",              // "active" or "inactive" (for rotating staff)
      "guessTheCoworker": {
        "clues": [
          "always forgets to unmute",  // Clue 1
          "loves coffee more than sleep", // Clue 2
          "background always changes"  // Clue 3 (add 3-5 per person)
        ]
      }
    }
  ],
  "metadata": {
    "lastUpdated": "2026-06-08",       // Date of last update
    "totalMembers": 5,                 // Current count
    "instructions": "..."              // Notes for yourself
  }
}
```

---

## Tips for Good Clues

**What makes a good Guess the Coworker clue:**
- ✅ Specific to that person (not generic)
- ✅ Observable during meetings (video, chat behavior, etc.)
- ✅ Fun/lighthearted
- ✅ 3-5 clues per person
- ✅ Avoid real private information

**Examples for each person:**
- Alice: "always forgets to unmute", "camera always off", "loves coffee"
- Bob: "has a cat on camera", "background is always blurry", "types in all caps"
- Carol: "always late to meetings", "uses too many emojis", "forgets to turn off share screen"

---

## Managing Growing Teams

### **Adding a New Team Member**

1. Get a new team member's name and favorite emoji
2. In GitHub (or VS Code):
   ```json
   {
     "id": "member-006",
     "name": "New Person",
     "avatar": "🎭",
     "status": "active",
     "guessTheCoworker": {
       "clues": [
         "clue about them",
         "another clue",
         "third clue"
       ]
     }
   }
   ```
3. Commit and push
4. Done! They're in the system

### **Removing a Team Member (Intern/Contractor Leaves)**

Option A: Delete their entry
```bash
# Remove the entire {} block for that person
```

Option B: Mark as inactive (keep history)
```json
"status": "inactive"
// They won't be asked about, but record is preserved
```

---

## Deployment Status

After you commit, check if Netlify is deploying:

**Go to:** `https://app.netlify.com/sites/team-games-app/deploys`

You should see a new deploy starting. Wait for the green checkmark.

Once deployed:
- Visit: `https://team-games-app.netlify.app`
- Start a game of Guess the Coworker
- Your updated clues will be used!

---

## Troubleshooting

**Q: I edited the file but the game still shows old clues**
- A: Wait 30 seconds for Netlify to deploy. Hard-refresh your browser (Cmd+Shift+R on Mac)

**Q: The JSON won't save (GitHub shows an error)**
- A: Check the syntax - make sure all quotes match and no trailing commas
- Use an online JSON validator: `jsonlint.com`

**Q: I want to use the old default clues for someone**
- A: Remove them from the roster entirely, and the game will fall back to DEFAULT_CLUES

**Q: How many clues should each person have?**
- A: 3-5 is ideal. The game will reuse them across rounds.

---

## Future Enhancement

When you're ready, we can add:
- ✅ Admin panel UI for easier editing (without GitHub)
- ✅ Support for 2 Truths & A Lie personalized statements
- ✅ Teams Against Humanity custom prompts per person
- ✅ Bulk import from CSV/spreadsheet

For now, the GitHub approach is fast, free, and works great! 🎯
