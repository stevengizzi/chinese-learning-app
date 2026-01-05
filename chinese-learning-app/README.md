# Mandarin Pinyin Practice App

A focused web application for practicing Mandarin Chinese character-to-pinyin conversion. This app implements systematic practice exercises that help you master the connection between Chinese characters and their pinyin pronunciation with tone numbers.

## Features

- **Character → Pinyin Practice**: View Chinese characters and type their pinyin with tone numbers
- **Immediate Feedback**: Instant grading with detailed error analysis
- **Tone-First Design**: Distinguishes between tone errors and syllable errors
- **Session Tracking**: Comprehensive performance reports with actionable insights
- **Data Persistence**: Progress saved in browser localStorage
- **Vocabulary Management**: Upload your own vocabulary list via markdown file
- **Mobile Responsive**: Works on phones, tablets, and desktops
- **Keyboard Shortcuts**:
  - `Enter`: Submit answer / Next exercise
  - `Escape`: View session report

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (for development)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/chinese-learning-app.git
cd chinese-learning-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### First Time Setup

1. Open the app in your browser
2. Click "📁 Update Vocabulary" to upload your vocabulary file
3. Select your `mandarin_vocabulary_repertoire.md` file
4. Start practicing!

### Vocabulary File Format

Your vocabulary file should be a Markdown file with this structure:

```markdown
---
title: Mandarin Vocabulary Repertoire
version: 0.1
last_updated: 2026-01-05
---

## Active Vocabulary

| Word | Pinyin | Meaning |
| ---- | ------ | ------- |
| 明白 | ming2 bai2 | to be clear, to understand |
| 花 | hua1 | flower, to spend (money/time) |
```

### Exercise Flow

1. **Exercise Screen**: View a Chinese character and type its pinyin
2. **Feedback Screen**: See your score, errors, and corrections
3. **Report Screen**: View session statistics and suggestions

### Updating Vocabulary

Click the "📁 Update Vocabulary" button (bottom-right corner during exercises or on welcome screen) to upload a new vocabulary file. The app will immediately use the updated vocabulary.

## Deployment

### GitHub Pages

This app is configured to deploy to GitHub Pages automatically:

1. Push your code to a GitHub repository
2. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions
3. Push to the `main` branch - the app will automatically deploy
4. Access your app at: `https://yourusername.github.io/chinese-learning-app/`

Note: Update the `base` path in `vite.config.ts` to match your repository name.

### Alternative Deployment Options

- **Vercel**: `npm install -g vercel && vercel`
- **Netlify**: Drag and drop the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)
- **Local File**: Open `dist/index.html` directly in a browser (data persistence will work)

## Project Structure

```
src/
├── components/          # React components
│   ├── ExerciseScreen.tsx    # Main exercise interface
│   ├── FeedbackScreen.tsx    # Answer feedback display
│   ├── ReportScreen.tsx      # Session statistics
│   ├── WelcomeScreen.tsx     # Initial landing page
│   └── VocabularyUploader.tsx # File upload component
├── contexts/           # State management
│   └── ExerciseContext.tsx   # Global app state
├── hooks/              # Custom React hooks
│   └── useKeyboardShortcuts.ts
├── lib/                # Core logic
│   ├── vocabularyParser.ts   # MD file parsing
│   ├── exerciseGenerator.ts  # Exercise creation
│   ├── pinyinGrader.ts      # Answer grading
│   └── reportGenerator.ts    # Statistics generation
├── types/              # TypeScript definitions
│   ├── vocabulary.ts
│   ├── exercise.ts
│   └── session.ts
└── App.tsx             # Root component
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence

## Learning Philosophy

This app aligns with the Mandarin Practice Framework by focusing on:

- **Recognition → Reproduction**: Converting visual characters to phonetic representation
- **Tone as First-Class**: Treating tone accuracy as a separate, critical skill
- **Immediate Feedback**: Instant error identification for rapid learning
- **Vocabulary Scoping**: Only practicing words you've actively learned

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Privacy

- All data stored locally in your browser
- No data sent to external servers
- Vocabulary file processed entirely client-side
- Export your session data anytime

## Future Enhancements

- Multi-word sentence exercises
- Spaced repetition algorithm
- Audio pronunciation support
- Historical progress tracking
- Multiple exercise types (pinyin→characters, audio→pinyin, etc.)

## Contributing

Contributions welcome! Please open an issue or pull request.

## License

MIT License - feel free to use and modify for your own learning.

## Support

If you encounter issues:
1. Check browser console for errors
2. Ensure vocabulary file is properly formatted
3. Try refreshing the page
4. Clear browser localStorage if needed

---

Built with ❤️ for Mandarin learners

**Happy practicing! 加油!**
