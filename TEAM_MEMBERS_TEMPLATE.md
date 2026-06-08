# Team Members Bulk Import Template

## Option 1: CSV Template (Easiest - Use Excel/Google Sheets)

Save this as `team-members.csv` and fill it in:

```csv
Name,Avatar,Clue1,Clue2,Clue3,Clue4,Clue5
Alice,🦸,always forgets to unmute,loves coffee more than sleep,background always changes,first to show up to meetings,has the best memes
Bob,🐱,takes the funniest screenshots,always has a cat on camera,claims they're on mute,background is always blurry,types in all caps
Carol,🦊,talks over everyone,never has their camera on,uses too many emojis,always late to meetings,forgets to turn off share screen
David,🧙,background looks professional,speaks in a monotone,asks great questions,always muted during important moments,camera quality is pristine
Emma,🐉,animated hand gestures,bright backgrounds,laughs at own jokes,always eating during calls,keyboard clicker
Frank,🎭,mysterious background,camera angle is weird,never turns on video,voice sounds distant,always has "connection issues"
Grace,🚀,super enthusiastic,asks for screenshots constantly,accidentally shares screen,types in Slack during calls,coffee addict
Henry,⚡,technical difficulties expert,shares screen by accident,forgets to unmute for 5 minutes,has 47 browser tabs open,"can you hear me now?"
Iris,🎸,always dressed up,professional background,speaks eloquently,never has technical issues,role model attendee
Jack,🧛,vampirish schedule,always last to join,first to leave,has the most creative excuses,lurks in chat silently
```

**Steps to use:**
1. Copy the template above into a file or Google Sheet
2. Fill in your 15 team members
3. Use the converter below to turn it into JSON
4. Copy the JSON into `src/data/team-roster.json`

---

## Option 2: JSON Template (Direct Editing)

Copy this template and fill it in directly:

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
          "background always changes",
          "first to show up to meetings",
          "has the best memes"
        ]
      }
    },
    {
      "id": "member-002",
      "name": "Bob",
      "avatar": "🐱",
      "status": "active",
      "guessTheCoworker": {
        "clues": [
          "takes the funniest screenshots",
          "always has a cat on camera",
          "claims they're on mute",
          "background is always blurry",
          "types in all caps"
        ]
      }
    },
    {
      "id": "member-003",
      "name": "Carol",
      "avatar": "🦊",
      "status": "active",
      "guessTheCoworker": {
        "clues": [
          "talks over everyone",
          "never has their camera on",
          "uses too many emojis"
        ]
      }
    }
  ]
}
```

**How to use:**
1. Copy the template above
2. Duplicate the `{...}` object for each team member
3. Fill in: name, avatar, and clues
4. Increment the `id` (member-001, member-002, etc.)
5. Save as `src/data/team-roster.json`

---

## Option 3: Google Sheets → JSON Converter

**Fastest way for non-technical users:**

### Step 1: Create Google Sheet
1. Open: https://sheets.google.com
2. Create new sheet
3. Add headers: `Name | Avatar | Clue1 | Clue2 | Clue3 | Clue4 | Clue5`
4. Fill in all 15 team members
5. Share the link with me OR export as CSV

### Step 2: Convert CSV to JSON
Use this Python script to convert:

```python
import csv
import json

def csv_to_json(csv_file, json_file):
    team_members = []
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            # Get all clues (Clue1, Clue2, etc.) and filter out empty ones
            clues = [row[f'Clue{i}'] for i in range(1, 6) if row.get(f'Clue{i}', '').strip()]
            
            member = {
                "id": f"member-{idx:03d}",
                "name": row['Name'],
                "avatar": row['Avatar'],
                "status": "active",
                "guessTheCoworker": {
                    "clues": clues
                }
            }
            team_members.append(member)
    
    output = {
        "teamMembers": team_members,
        "metadata": {
            "lastUpdated": "2026-06-08",
            "totalMembers": len(team_members)
        }
    }
    
    with open(json_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"✅ Converted {len(team_members)} team members!")

# Usage:
csv_to_json('team-members.csv', 'team-roster.json')
```

**How to use the script:**
1. Save the script above as `csv_to_json.py`
2. Place your `team-members.csv` in same folder
3. Run: `python csv_to_json.py`
4. Copy generated `team-roster.json` to `src/data/team-roster.json`

---

## Emoji Options

**Popular avatars to choose from:**

### People & Faces
- 🦸 Superhero
- 🧑‍💼 Business person
- 🧙 Wizard
- 🕵️ Detective
- 🤖 Robot
- 👨‍🎨 Artist
- 👩‍💻 Programmer

### Animals
- 🐱 Cat
- 🦊 Fox
- 🐹 Hamster
- 🦉 Owl
- 🐢 Turtle
- 🦆 Duck
- 🦁 Lion
- 🐉 Dragon
- 🦅 Eagle
- 🦝 Raccoon

### Fun/Creative
- 🎭 Mask (drama)
- 🎸 Guitar
- 🚀 Rocket
- ⚡ Lightning
- 🎪 Circus
- 🧛 Vampire
- 👻 Ghost
- 🎯 Target
- 🧿 Evil eye
- 🦄 Unicorn

---

## Tips for Good Clues

### What Makes a Good Clue:
✅ Specific to that person
✅ Observable during meetings
✅ Fun and lighthearted
✅ 3-5 clues per person (3 minimum)
✅ Avoids private information

### Examples by Personality Type:

**Always-on-mute person:**
- "always forgets to unmute"
- "speaks for 30 seconds before realizing they're muted"
- "has to be told they're on mute every meeting"

**Camera person:**
- "always has their camera on"
- "never has their camera on"
- "has a cat on camera"
- "background is always blurry"
- "background looks like a professional studio"

**Talker:**
- "talks over everyone"
- "never lets anyone finish a sentence"
- "dominates every discussion"
- "has strong opinions about everything"

**Quiet person:**
- "lurks in chat silently"
- "only speaks when spoken to"
- "speaks in one-word answers"
- "never turns on video"

**Tech issues:**
- "always has connection problems"
- "accidentally shares screen constantly"
- "technology hates them"
- "first to have technical difficulties"

**Coffee/Snack addict:**
- "always eating during calls"
- "never without their coffee"
- "has visible beverage in every meeting"

**Personality quirks:**
- "uses too many emojis"
- "keyboard clicker"
- "animated hand gestures"
- "laughs at own jokes"
- "says 'um' a lot"

---

## Step-by-Step Bulk Update Process

### For Mac (Local Edit):

```bash
# 1. Create your CSV file with all 15 team members
#    (use template above, save as ~/Downloads/team-members.csv)

# 2. Run the Python converter
python3 csv_to_json.py

# 3. Copy the generated file
cp team-roster.json ~/team-games-netlify/src/data/team-roster.json

# 4. Commit to GitHub
cd ~/team-games-netlify
git add src/data/team-roster.json
git commit -m "bulk: add 15 team members with clues"
git push origin main

# 5. ✅ Done! Changes deploy automatically
```

### For GitHub Direct (No Python needed):

```
1. Go to GitHub: src/data/team-roster.json
2. Click edit pencil
3. Paste the JSON from template above
4. Fill in all 15 team members
5. Commit changes
6. ✅ Auto-deploys
```

---

## Validation Checklist

Before committing, verify:

- ✅ Each member has: id, name, avatar, status
- ✅ Each member has 3-5 clues minimum
- ✅ All JSON syntax is valid (use jsonlint.com)
- ✅ No trailing commas
- ✅ Avatar is a single emoji
- ✅ Member IDs are unique (member-001, member-002, etc.)
- ✅ Status is "active" or "inactive"

---

## Updating Later

**To add one more team member:**
1. Add new object to `teamMembers` array
2. Increment the `id`
3. Add name, avatar, clues
4. Commit to GitHub
5. ✅ Auto-deploys

**To mark someone as inactive (intern leaves):**
```json
"status": "inactive"
```
They won't be asked about, but record is preserved.

---

## Quick Reference

| Format | Ease | Tools Needed | Steps |
|--------|------|--------------|-------|
| **CSV + Python** | Easy | Python 3 | 4 steps, fully automated |
| **JSON Template** | Medium | Text editor | Copy, fill, commit |
| **Google Sheets** | Easy | Browser | Fill online, export, convert |
| **GitHub Direct** | Hard | Browser | Manual JSON edit |

---

## Example: Fully Populated JSON (3 Members)

```json
{
  "teamMembers": [
    {
      "id": "member-001",
      "name": "Alice Chen",
      "avatar": "🦸",
      "status": "active",
      "guessTheCoworker": {
        "clues": [
          "always forgets to unmute at the start",
          "has the most organized desk setup",
          "asks the best questions in meetings",
          "background is always perfectly lit",
          "never has technical issues"
        ]
      }
    },
    {
      "id": "member-002",
      "name": "Bob Martinez",
      "avatar": "🐱",
      "status": "active",
      "guessTheCoworker": {
        "clues": [
          "always has a cat photobombing their video",
          "types extremely fast in chat",
          "makes everyone laugh at serious meetings",
          "background is always chaotic"
        ]
      }
    },
    {
      "id": "member-003",
      "name": "Carol Thompson",
      "avatar": "🦊",
      "status": "active",
      "guessTheCoworker": {
        "clues": [
          "speaks in a calm, measured tone",
          "never joins video calls",
          "always has insightful comments",
          "uses perfect grammar in chat",
          "never misses a deadline"
        ]
      }
    }
  ],
  "metadata": {
    "lastUpdated": "2026-06-08",
    "totalMembers": 3,
    "instructions": "Edit in GitHub. When you commit and push, Netlify auto-deploys within 30 seconds."
  }
}
```

---

## Need Help?

- **Syntax errors?** Use https://jsonlint.com to validate JSON
- **Python not installed?** Use the JSON template instead
- **More emoji options?** Search "emoji list" online
- **Want to import from existing data?** Let me know the format!

Pick the method that works for you and let me know if you need help! 🎯
