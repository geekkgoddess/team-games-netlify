# ✅ Leaderboard Persistence - THE CORRECT FIX

## Why It Wasn't Working

**The Problem:** Landing page and game app are TWO SEPARATE Netlify sites:
- **Game app** (GitHub auto-deploy): team-games-app.netlify.app
- **Landing page** (drag-drop): team-games.netlify.app

I mistakenly put `leaderboard.json` in `src/data/` (game app folder), but landing page couldn't access it!

**The Fix:** Put `leaderboard.json` in `landing/data/` (where it gets drag-dropped to Netlify)

---

## ✅ CORRECT Workflow for Landing Page Leaderboard

### **Step 1: Edit on Your Mac Locally**

```bash
cd ~/team-games-netlify/landing/data/
# Edit the file in VS Code
code leaderboard.json
```

Or use GitHub editor (see below)

### **Step 2: Two Options to Deploy**

#### **Option A: Edit Locally + Drag-Drop to Netlify (RECOMMENDED for landing page)**

```bash
# Edit landing/data/leaderboard.json locally
code ~/team-games-netlify/landing/data/leaderboard.json

# Make your changes, save the file

# Drag the landing/ folder to Netlify
# In Netlify dashboard:
# 1. Go to team-games.netlify.app
# 2. Find "Deploys" tab
# 3. Drag landing/ folder to deploy area
# 4. ✅ Changes live in seconds
```

#### **Option B: Edit in GitHub + Drag-Drop**

```
1. Go to GitHub: landing/data/leaderboard.json
2. Click edit pencil
3. Make changes
4. Commit to main branch
5. Pull the changes locally:
   git pull origin main
6. Drag landing/ folder to Netlify
7. ✅ Changes live
```

---

## Quick Test

### **Do This Right Now to Test:**

1. **Open the landing page admin panel:**
   - https://team-games.netlify.app
   - Click "⚙️ Admin"
   - Password: `admin1937`

2. **Make a simple change:**
   - Change champion score from 320 to 999
   - Click "✅ Apply Changes"
   - See it update on page immediately

3. **Save permanently:**
   - Click "📝 Edit on GitHub"
   - Edit landing/data/leaderboard.json
   - Change score: `"score": 999`
   - Commit in GitHub

4. **Deploy to landing page:**
   - Open Netlify dashboard
   - Go to: https://app.netlify.com/sites/team-games/deploys
   - Drag `landing/` folder to deploy area
   - Or wait 30-60 seconds if auto-detect is enabled

5. **Verify it works:**
   - Refresh landing page
   - See champion score is now 999
   - ✅ It persisted!

---

## JSON File Locations

**IMPORTANT: Two Separate Leaderboards Now**

| File | Purpose | Deployment | Edit Method |
|------|---------|-----------|------------|
| `landing/data/leaderboard.json` | Landing page scores | Drag-drop to Netlify | Local file + GitHub |
| `src/data/team-roster.json` | Team clues for game | GitHub auto-deploy | GitHub direct |

---

## Step-by-Step Instructions

### **Workflow 1: Admin Panel → GitHub → Netlify**

```
1. Landing page admin panel
   └─ Edit champion/players
   └─ Click "✅ Apply Changes"
   └─ Preview updates on page

2. Click "📝 Edit on GitHub"
   └─ GitHub opens landing/data/leaderboard.json
   └─ Make edits in browser
   └─ Commit changes

3. Pull changes locally
   └─ git pull origin main
   └─ landing/data/leaderboard.json updated locally

4. Deploy to Netlify
   └─ Drag landing/ folder to Netlify
   └─ OR use Netlify auto-deploy (if enabled)

5. ✅ Done! Landing page updated
```

### **Workflow 2: VS Code Locally → GitHub → Netlify**

```
1. Edit locally
   └─ code ~/team-games-netlify/landing/data/leaderboard.json
   └─ Make changes and save

2. Commit to GitHub
   └─ git add landing/data/leaderboard.json
   └─ git commit -m "Update leaderboard"
   └─ git push origin main

3. Drag-drop to Netlify
   └─ (If auto-deploy not enabled)
   └─ Drag landing/ folder to Netlify dashboard

4. ✅ Done! Landing page updated
```

---

## Important Notes

### **Drag-Drop Deployment**

Since landing page is drag-drop:
1. Changes only deploy when you drag-drop the `landing/` folder
2. If you edit locally and don't drag-drop, changes won't be live
3. Auto-deploy can be enabled in Netlify if GitHub is connected

### **Admin Panel**

The admin panel:
- ✅ Updates the page instantly (localStorage + display)
- ✅ Can export JSON for backup
- ✅ Shows GitHub edit link
- BUT: **Doesn't auto-deploy to Netlify** (that's your drag-drop)

### **File Paths**

```
Your Mac (local development):
└── ~/team-games-netlify/
    ├── landing/
    │   ├── index.html
    │   └── data/
    │       └── leaderboard.json  ← Edit this file
    └── src/
        └── data/
            └── leaderboard.json  ← Ignore this (was my mistake)
```

---

## Troubleshooting

**Q: I edited the JSON but landing page shows old data**
- A: Did you drag-drop the landing/ folder to Netlify? That's required!
- A: Check Netlify "Deploys" tab - was there a new deploy?

**Q: Netlify doesn't see my changes**
- A: Make sure you're dragging the `landing/` folder, not individual files
- A: Drag to the "Deploys" tab on Netlify website

**Q: Can I enable auto-deploy?**
- A: Yes! If Netlify detects GitHub, it can auto-deploy on git push
- A: Check Netlify build settings (should be disabled for drag-drop)

**Q: Why two leaderboard files?**
- A: My mistake - I put it in src/data (game app) instead of landing/ (landing page)
- A: `landing/data/leaderboard.json` is the ONLY one you need
- A: You can delete `src/data/leaderboard.json` if you want

**Q: Can I edit from work computer?**
- A: Yes! Use "📝 Edit on GitHub" button
- A: Or edit landing/data/leaderboard.json directly in GitHub
- A: Then drag-drop landing/ folder from your Mac when you get home

---

## Summary

```
BEFORE (Broken):
Admin panel → localStorage → Only works on ONE browser ❌

AFTER (Fixed):
Admin panel → landing/data/leaderboard.json → Drag-drop to Netlify → Works everywhere ✅
```

**Key Fix:** The file MUST be in `landing/data/leaderboard.json` to be accessible on the landing page Netlify site!

---

## Next Steps

1. **Test it with the quick test above**
2. **Update your champion/scores in the JSON**
3. **Drag the landing/ folder to Netlify**
4. **Verify it works!**

Let me know if this fixes the issue! 🎯
