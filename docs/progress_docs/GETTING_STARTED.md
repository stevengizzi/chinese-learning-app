# Getting Started - Mandarin Pinyin Practice App

## 🚀 Your App is Built and Ready!

The complete Mandarin pinyin practice app has been built in the `chinese-learning-app/` directory.

---

## ⚡ Quick Start (Use Right Now)

### Option 1: Open in Browser (Simplest)

```bash
cd chinese-learning-app
open dist/index.html
```

That's it! The app will open in your browser. Click "Update Vocabulary" and select your `docs/mandarin_vocabulary_repertoire.md` file.

### Option 2: Local Web Server (Better Experience)

```bash
cd chinese-learning-app/dist
python3 -m http.server 8000
```

Then open: http://localhost:8000

---

## 🌐 Deploy to GitHub Pages (Recommended for Long-Term Use)

### Step 1: Create GitHub Repository

```bash
cd chinese-learning-app
git init
git add .
git commit -m "Initial commit: Mandarin Pinyin Practice App"
```

### Step 2: Push to GitHub

1. Go to https://github.com/new
2. Create a new repository named `chinese-learning-app` (or any name you prefer)
3. **Don't** initialize with README (your code already has one)
4. Copy the commands GitHub shows you, or use these:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chinese-learning-app.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Source", select **"GitHub Actions"**
5. The app will automatically build and deploy!

### Step 4: Access Your App

After ~1-2 minutes, your app will be live at:

```
https://YOUR_USERNAME.github.io/chinese-learning-app/
```

Bookmark this URL for easy access!

---

## 📝 Using the App

### First Time

1. Open the app (local file or GitHub Pages URL)
2. Click "📁 Update Vocabulary" button
3. Select `docs/mandarin_vocabulary_repertoire.md` from your computer
4. Start practicing!

### Practicing

1. View the Chinese character
2. Type its pinyin with tone numbers (e.g., `ming2 bai2`)
3. Press `Enter` or click "Submit Answer"
4. View your score and corrections
5. Press `Enter` or click "Next Exercise"
6. Repeat!

### Viewing Progress

- Press `Escape` or click "View Report" anytime
- See your accuracy, error breakdown, and suggestions
- Click "Export Data" to save your session as JSON
- Click "Continue Session" to keep practicing
- Click "Start New Session" to reset statistics

### Updating Vocabulary

1. Edit your `docs/mandarin_vocabulary_repertoire.md` file
2. Open the app
3. Click the "📁 Update Vocabulary" button (bottom-right corner)
4. Select your updated file
5. New words will be used immediately!

---

## 🎹 Keyboard Shortcuts

- **Enter**: Submit answer / Next exercise
- **Escape**: View session report

---

## 🎯 Pinyin Format

Use tone numbers (1-4) at the end of each syllable:

- ✅ Correct: `ming2 bai2`
- ✅ Correct: `wo3 ming2 bai2`
- ❌ Wrong: `ming bai` (missing tones)
- ❌ Wrong: `míng bái` (tone marks not supported yet)

---

## 📱 Device Compatibility

Works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablets

---

## 💾 Data Storage

- All data saved in browser localStorage
- Vocabulary persists across sessions
- Session history available until you clear browser data
- Each device stores its own data independently

---

## 🔧 Troubleshooting

### "No vocabulary loaded" message

- Click "📁 Update Vocabulary"
- Ensure you're selecting a `.md` file
- Check that file has `## Active Vocabulary` section with a table

### Data disappeared

- Check if you're using private/incognito mode (data won't persist)
- Check if browser data was cleared
- Export session data regularly as backup

### App shows blank screen (GitHub Pages)

- Wait 1-2 minutes after first deployment
- Check that GitHub Actions workflow completed successfully
- Ensure `base` in `vite.config.ts` matches your repo name

---

## 📂 File Locations

```
chinese_learning/
├── chinese-learning-app/          # ← The app
│   ├── dist/                      # ← Built app (ready to use)
│   │   └── index.html             # ← Open this file
│   ├── README.md                  # ← Full documentation
│   ├── QUICK_START.md             # ← Quick reference
│   └── BUILD_SUMMARY.md           # ← What was built
└── docs/
    ├── mandarin_vocabulary_repertoire.md  # ← Your vocabulary
    ├── character_to_pinyin_exercise_template.md
    ├── mandarin_practice_framework_v2.md
    └── app_design_plan.md
```

---

## 🎓 Learning Tips

1. **Start Small**: Practice 5-10 exercises per session
2. **Focus on Tones**: The app highlights tone errors separately
3. **Review Reports**: Check which tones you confuse (e.g., 2nd vs 3rd)
4. **Regular Practice**: Daily short sessions beat weekend marathons
5. **Export Progress**: Save session data to track improvement over time

---

## 🚀 You're Ready!

The app is fully functional and ready to use. Choose your preferred method above and start practicing!

**加油! (jiā yóu - Go for it!)**

---

## 📞 Need Help?

- Check [README.md](chinese-learning-app/README.md) for detailed docs
- Check [QUICK_START.md](chinese-learning-app/QUICK_START.md) for quick reference
- Check [BUILD_SUMMARY.md](chinese-learning-app/BUILD_SUMMARY.md) for technical details
