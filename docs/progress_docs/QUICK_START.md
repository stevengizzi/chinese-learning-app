# Quick Start Guide

## For Immediate Use (No Setup Required)

If you just want to start using the app right away:

1. **Build the app**:
   ```bash
   cd chinese-learning-app
   npm install
   npm run build
   ```

2. **Open in browser**:
   - Open `dist/index.html` directly in your browser
   - Or use a local server:
     ```bash
     cd dist
     python3 -m http.server 8000
     ```
   - Then visit `http://localhost:8000`

3. **Upload your vocabulary**:
   - Click "📁 Update Vocabulary"
   - Select your `mandarin_vocabulary_repertoire.md` file
   - Start practicing!

## For GitHub Pages Deployment

1. **Create a GitHub repository**:
   ```bash
   cd chinese-learning-app
   git init
   git add .
   git commit -m "Initial commit: Mandarin Pinyin Practice App"
   ```

2. **Push to GitHub**:
   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/yourusername/chinese-learning-app.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repo settings
   - Navigate to "Pages" section
   - Under "Source", select "GitHub Actions"
   - The app will automatically build and deploy!

4. **Access your app**:
   - Visit: `https://yourusername.github.io/chinese-learning-app/`
   - Bookmark it for easy access

## Updating the Base Path

If your GitHub repo name is different from `chinese-learning-app`, update [vite.config.ts](vite.config.ts:7):

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',  // Change this to match your repo name
})
```

## Troubleshooting

**Build fails with "Node.js version" error:**
- The build requires Node 20.19+ or 22.12+
- Update Node.js or use nvm: `nvm install 22 && nvm use 22`
- Or deploy to GitHub Pages which will use the correct version automatically

**App shows blank screen:**
- Check that the `base` path in `vite.config.ts` matches your deployment URL
- For local use, set `base: '/'`
- For GitHub Pages, set `base: '/repo-name/'`

**Vocabulary upload doesn't work:**
- Ensure your file has an "## Active Vocabulary" section
- Check that the table has Word, Pinyin, and Meaning columns
- File must be a `.md` or `.markdown` file

**Data isn't persisting:**
- Data is stored in browser localStorage
- Private/Incognito mode may not persist data
- Clearing browser data will erase your session history

## Features Overview

### Exercise Screen
- Large Chinese characters
- Text input for pinyin
- Submit button or press Enter
- View Report button or press Escape

### Feedback Screen
- Score display (X / Y correct)
- Aligned comparison view
- Detailed error breakdown
- Next Exercise button or press Enter

### Report Screen
- Total exercises completed
- Average accuracy percentage
- Tone vs syllable error breakdown
- Common mistakes list
- Personalized suggestions
- Export session data (JSON)

## Keyboard Shortcuts

- **Enter**: Submit answer / Next exercise
- **Escape**: View session report
- Focus automatically returns to input after each exercise

## Data Management

### Exporting Data
- Click "Export Data" on the Report screen
- Saves a JSON file with your session history

### Updating Vocabulary
- Click the floating "📁 Update Vocabulary" button (bottom-right)
- Select new vocabulary file
- App immediately uses updated words
- Previous vocabulary is replaced (export sessions first if needed!)

## Tips for Best Results

1. **Start Simple**: Begin with single-word exercises to build muscle memory
2. **Focus on Tones**: Pay special attention to tone number accuracy
3. **Review Reports**: Check which tones/syllables you confuse most often
4. **Regular Practice**: Short, frequent sessions are more effective than long cramming
5. **Export Progress**: Periodically export your data to track long-term improvement

---

Ready to practice? 加油! (jiā yóu - Add oil! / Go for it!)
