# Mandarin Pinyin Practice App - Comprehensive Design & Implementation Plan

## Executive Summary

This document outlines the complete design and implementation strategy for a web-based Mandarin pinyin practice application. The app implements the exercise framework defined in `character_to_pinyin_exercise_template.md`, pulling vocabulary from `mandarin_vocabulary_repertoire.md`, and aligning with the learning philosophy in `mandarin_practice_framework_v2.md`.

**Core Focus**: Character → Pinyin reproduction (Test #10 from Framework v2: "Read characters → write pinyin")

---

## Table of Contents

1. [Design Philosophy & Learning Alignment](#1-design-philosophy--learning-alignment)
2. [UI/UX Design](#2-uiux-design)
3. [Technical Architecture](#3-technical-architecture)
4. [Data Models](#4-data-models)
5. [Core Features & Components](#5-core-features--components)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Future Enhancements](#7-future-enhancements)

---

## 1. Design Philosophy & Learning Alignment

### 1.1 Learning Framework Alignment

Based on `mandarin_practice_framework_v2.md`, this app targets:

- **Data Type**: Characters (visual) → Pinyin (phonetic representation)
- **Capability**: Character Recognition → Pinyin Reproduction
- **Skill Type**: Verification test (non-interactive, single-item assessment)
- **Unit Size**: Word level, scaling to sentence level
- **Performance Dimensions**:
  - Accuracy (syllable correctness)
  - Tone accuracy (first-class dimension)
  - Latency (implicit through session pacing)

### 1.2 Core Design Principles

1. **Focused Practice**: Single skill training (characters → pinyin)
2. **Immediate Feedback**: Instant grading with visual alignment
3. **Tone Emphasis**: Tone errors treated as first-class mistakes
4. **Minimal Distraction**: Clean, typography-focused interface
5. **Progress Tracking**: Granular error categorization
6. **Vocabulary Scoping**: Only uses user's active vocabulary

---

## 2. UI/UX Design

### 2.1 Visual Design Language

**Design System:**
- **Typography-First**: Large, readable Chinese characters (40-48px)
- **Monospace for Pinyin**: Enables vertical alignment of comparisons
- **Color Coding**:
  - Correct answers: Green (#22c55e)
  - Incorrect answers: Red (#ef4444)
  - Neutral/Instructions: Gray (#6b7280)
  - Primary actions: Blue (#3b82f6)
- **Spacing**: Generous whitespace, focused attention
- **Responsive**: Mobile-first, works on phone/tablet/desktop

### 2.2 Screen Layouts

#### 2.2.1 Exercise Screen (Primary View)

```
┌─────────────────────────────────────────────┐
│                                             │
│         Exercise 5 of ∞                     │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │                                   │    │
│   │        我明白                     │    │
│   │                                   │    │
│   └───────────────────────────────────┘    │
│                                             │
│   👉 Type the tone-number pinyin:          │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │ wo3 ming2 bai2_                   │    │
│   └───────────────────────────────────┘    │
│                                             │
│   [Submit Answer]  [Request Report]        │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Elements:**
- Exercise counter (shows progress)
- Large character display (boxed, centered)
- Clear instruction with emoji
- Input field (autocomplete off, spellcheck off)
- Two-button action bar

#### 2.2.2 Feedback Screen (After Submission)

```
┌─────────────────────────────────────────────┐
│                                             │
│  ✅ Score: 2 / 3 characters correct        │
│                                             │
│  Comparison:                                │
│  ┌───────────────────────────────────┐     │
│  │ Correct: wo3 ming2 bai2           │     │
│  │ Yours  : wo3 ming2 bai            │     │
│  └───────────────────────────────────┘     │
│                                             │
│  ⚠️ Correction needed:                     │
│  • 白 is bai2 (2nd tone) - tone missing    │
│                                             │
│  [Next Exercise]                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Elements:**
- Score badge (visual success indicator)
- Monospace comparison (aligned vertically)
- Specific error breakdown
- Single clear action: continue

#### 2.2.3 Session Report Screen

```
┌─────────────────────────────────────────────┐
│                                             │
│         📊 Session Report                   │
│                                             │
│  Total Exercises: 12                        │
│  Average Accuracy: 88%                      │
│                                             │
│  Error Breakdown:                           │
│  • Tone Errors: 3                           │
│  • Syllable Errors: 1                       │
│  • Complete Misses: 0                       │
│                                             │
│  Common Mistakes:                           │
│  • xue2 vs xue3 (2 times)                   │
│  • zou3 vs zuo3 (1 time)                    │
│                                             │
│  💡 Suggested Focus:                        │
│  Review 3rd vs 2nd tone distinctions        │
│                                             │
│  [Start New Session]  [Export Data]         │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.3 User Flow

```
[Start] → [Exercise Screen] → [Type Answer] → [Submit]
                ↑                                  ↓
                |                            [Feedback Screen]
                |                                  ↓
                └──────────[Next Exercise]─────────┘
                                   ↓
                              [Request Report]
                                   ↓
                            [Report Screen]
                                   ↓
                          [Start New Session]
```

### 2.4 Interaction Details

**Input Handling:**
- Accept tone numbers (1-4) or tone marks (optional enhancement)
- Space-separated syllables
- Ignore extra whitespace
- Enter key submits answer
- Escape key shows report

**Keyboard Shortcuts:**
- `Enter`: Submit answer / Next exercise
- `Cmd/Ctrl + R`: Request report
- `Cmd/Ctrl + N`: New session (from report)

**Mobile Considerations:**
- Large touch targets (48px minimum)
- Native keyboard with numbers
- Swipe gestures for next exercise

---

## 3. Technical Architecture

### 3.1 Technology Stack Recommendation

**Frontend Framework:** React with TypeScript
- Component-based architecture
- Strong typing for vocabulary/exercise data
- Large ecosystem, good documentation
- Easy to start, scales well

**Styling:** Tailwind CSS
- Utility-first, rapid development
- Built-in responsive design
- Easy color/spacing consistency
- No CSS file management

**Build Tool:** Vite
- Fast development server
- TypeScript support out-of-box
- Modern, minimal configuration

**State Management:** React Context + useReducer
- No external library needed for this scope
- Sufficient for single-user app
- Simple mental model

**Data Parsing:** Custom Markdown parser
- Parse `mandarin_vocabulary_repertoire.md` at build/runtime
- Extract table data into structured format

**Deployment:**
- Option 1: Vercel/Netlify (static hosting, free tier)
- Option 2: GitHub Pages (simple, free)
- Option 3: Local-first (Electron wrapper for desktop app)

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React App                         │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  App.tsx     │  │  Router      │               │
│  │  (Root)      │──│  (Optional)  │               │
│  └──────────────┘  └──────────────┘               │
│         │                                          │
│         ├─────────────────┬─────────────────┐     │
│         ↓                 ↓                 ↓     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Exercise     │  │ Feedback     │  │ Report  ││
│  │ Screen       │  │ Screen       │  │ Screen  ││
│  └──────────────┘  └──────────────┘  └─────────┘│
│         │                                          │
│  ┌──────────────────────────────────────────┐    │
│  │      Exercise State Context              │    │
│  │  - Current exercise                      │    │
│  │  - Session history                       │    │
│  │  - Vocabulary pool                       │    │
│  └──────────────────────────────────────────┘    │
│         │                                          │
│  ┌──────────────────────────────────────────┐    │
│  │         Core Logic Modules               │    │
│  │  - Exercise Generator                    │    │
│  │  - Pinyin Grader                         │    │
│  │  - Sentence Builder                      │    │
│  │  - Report Generator                      │    │
│  └──────────────────────────────────────────┘    │
│         │                                          │
│  ┌──────────────────────────────────────────┐    │
│  │         Data Layer                       │    │
│  │  - Vocabulary Parser                     │    │
│  │  - Session Storage                       │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.3 Directory Structure

```
chinese-learning-app/
├── public/
│   └── mandarin_vocabulary_repertoire.md
├── src/
│   ├── components/
│   │   ├── ExerciseScreen.tsx
│   │   ├── FeedbackScreen.tsx
│   │   ├── ReportScreen.tsx
│   │   ├── CharacterDisplay.tsx
│   │   ├── PinyinInput.tsx
│   │   └── ComparisonView.tsx
│   ├── hooks/
│   │   ├── useExerciseSession.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── vocabularyParser.ts
│   │   ├── exerciseGenerator.ts
│   │   ├── sentenceBuilder.ts
│   │   ├── pinyinGrader.ts
│   │   └── reportGenerator.ts
│   ├── types/
│   │   ├── vocabulary.ts
│   │   ├── exercise.ts
│   │   └── session.ts
│   ├── contexts/
│   │   └── ExerciseContext.tsx
│   ├── data/
│   │   └── vocabularyData.ts (generated from MD)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 4. Data Models

### 4.1 TypeScript Type Definitions

```typescript
// vocabulary.ts
export interface VocabularyEntry {
  word: string;        // Chinese characters
  pinyin: string;      // Tone-number pinyin (e.g., "ming2 bai2")
  meaning: string;     // English gloss
}

export interface VocabularyData {
  active: VocabularyEntry[];
  metadata: {
    version: string;
    lastUpdated: string;
  };
}

// exercise.ts
export interface Exercise {
  id: string;
  sentence: string;           // Chinese characters
  correctPinyin: string;      // Correct tone-number pinyin
  words: VocabularyEntry[];   // Words used in sentence
  difficulty?: number;        // Future: 1-5 scale
}

export interface ExerciseAttempt {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  score: {
    correct: number;
    total: number;
  };
  errors: ErrorDetail[];
  timestamp: number;
}

export interface ErrorDetail {
  characterIndex: number;
  character: string;
  expectedPinyin: string;
  userPinyin: string;
  errorType: 'tone' | 'syllable' | 'missing' | 'extra';
}

// session.ts
export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  attempts: ExerciseAttempt[];
  statistics: SessionStatistics;
}

export interface SessionStatistics {
  totalExercises: number;
  totalCharacters: number;
  correctCharacters: number;
  averageAccuracy: number;
  toneErrors: number;
  syllableErrors: number;
  commonMistakes: Map<string, number>;
}
```

### 4.2 State Management Schema

```typescript
interface ExerciseState {
  vocabulary: VocabularyData;
  currentSession: Session;
  currentExercise: Exercise | null;
  currentAttempt: ExerciseAttempt | null;
  screen: 'exercise' | 'feedback' | 'report';
}

type ExerciseAction =
  | { type: 'START_SESSION' }
  | { type: 'SUBMIT_ANSWER'; payload: string }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'REQUEST_REPORT' }
  | { type: 'NEW_SESSION' };
```

---

## 5. Core Features & Components

### 5.1 Vocabulary Parser

**Purpose**: Parse `mandarin_vocabulary_repertoire.md` into structured data

**Algorithm**:
1. Read markdown file
2. Locate "Active Vocabulary" section
3. Parse table rows (skip header, separator)
4. Extract: word, pinyin, meaning
5. Validate data (no empty fields)
6. Return `VocabularyData` object

**Edge Cases**:
- Handle multi-word phrases
- Handle pinyin with 'r' suffix (e.g., "hao3 wan2 r")
- Handle missing tone numbers (warn/error)

### 5.2 Sentence Builder

**Purpose**: Generate grammatically simple, contextually coherent sentences

**Strategy (MVP)**:
- Start with **single words** (simplest case)
- Progress to **2-word combinations**
- Eventually add **simple sentence templates**

**Templates** (Future):
```
Subject + Verb: 我 + 做
Subject + Verb + Object: 孩子 + 听见 + 谢谢
Verb + Object: 准备 + 考试 (when relevant words exist)
```

**Rules**:
- Only use words from active vocabulary
- No unknown grammar constructions
- Keep sentences 2-5 characters initially
- Ensure sentences make semantic sense

### 5.3 Pinyin Grader

**Purpose**: Compare user input to correct pinyin with detailed error reporting

**Algorithm**:
```
1. Normalize both strings (trim, lowercase, collapse whitespace)
2. Split into syllables (space-delimited)
3. Align syllables (handle missing/extra syllables)
4. For each syllable pair:
   a. Extract base syllable (e.g., "ming" from "ming2")
   b. Extract tone (e.g., "2" from "ming2")
   c. Compare base syllables → syllable error if mismatch
   d. Compare tones → tone error if mismatch
5. Calculate score (correct syllables / total syllables)
6. Generate error details with character mapping
```

**Error Categories**:
- **Tone Error**: Correct syllable, wrong/missing tone
- **Syllable Error**: Wrong syllable
- **Missing**: Expected syllable not provided
- **Extra**: Unexpected syllable provided

**Example**:
```
Correct: wo3 ming2 bai2
User:    wo3 ming2 bai

Result: 2/3 correct
Error: Character '白' - expected 'bai2', got 'bai' (tone missing)
```

### 5.4 Exercise Generator

**Purpose**: Select vocabulary and create exercises

**Algorithm (MVP)**:
```
1. Select random word(s) from active vocabulary
2. Initially: single-word exercises
3. Create Exercise object with:
   - sentence = word
   - correctPinyin = word's pinyin
   - words = [vocabularyEntry]
4. Return exercise
```

**Future Enhancements**:
- Spaced repetition (prioritize words with recent errors)
- Progressive difficulty (start simple, increase complexity)
- Avoid recent repetition (track last N exercises)

### 5.5 Report Generator

**Purpose**: Aggregate session data into actionable insights

**Metrics**:
- Total exercises completed
- Average accuracy percentage
- Total characters tested
- Error breakdown (tone vs syllable)
- Most common mistakes (sorted by frequency)

**Analysis**:
- Identify tone patterns (2nd vs 3rd tone confusion)
- Identify similar syllable confusions (zou3 vs zuo3)
- Suggest focus areas

---

## 6. Implementation Roadmap

### Phase 1: Project Setup & Foundation (Est. 2-3 hours)

**Step 1.1: Initialize Project**
```bash
npm create vite@latest chinese-learning-app -- --template react-ts
cd chinese-learning-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 1.2: Configure Tailwind**
- Update `tailwind.config.js`
- Add Tailwind directives to `index.css`

**Step 1.3: Set Up Project Structure**
- Create directory structure (as defined in 3.3)
- Set up TypeScript types (vocabulary.ts, exercise.ts, session.ts)

**Step 1.4: Copy Vocabulary File**
- Copy `mandarin_vocabulary_repertoire.md` to `public/` folder

**Deliverable**: Empty React app with proper structure and styling setup

---

### Phase 2: Data Layer (Est. 3-4 hours)

**Step 2.1: Build Vocabulary Parser**
- Implement `vocabularyParser.ts`
- Function: `parseVocabularyMarkdown(content: string): VocabularyData`
- Write unit tests (optional but recommended)
- Test with actual vocabulary file

**Step 2.2: Load Vocabulary on App Start**
- Fetch vocabulary file in App.tsx
- Parse and store in state/context
- Handle loading states and errors

**Step 2.3: Create Exercise Generator (MVP)**
- Implement `exerciseGenerator.ts`
- Function: `generateExercise(vocabulary: VocabularyEntry[]): Exercise`
- Start with single-word exercises
- Assign unique IDs to exercises

**Deliverable**: App can load vocabulary and generate simple exercises

---

### Phase 3: Core Exercise Logic (Est. 4-5 hours)

**Step 3.1: Implement Pinyin Grader**
- Implement `pinyinGrader.ts`
- Function: `gradeAnswer(userAnswer: string, correct: string, sentence: string): ExerciseAttempt`
- Test with various inputs:
  - Correct answers
  - Tone errors
  - Syllable errors
  - Missing/extra syllables

**Step 3.2: Build State Management**
- Create `ExerciseContext.tsx`
- Define state and reducer
- Actions: START_SESSION, SUBMIT_ANSWER, NEXT_EXERCISE, REQUEST_REPORT

**Step 3.3: Create Session Tracking**
- Track attempts in session state
- Calculate running statistics
- Persist to localStorage (optional)

**Deliverable**: Functional exercise logic with grading and state management

---

### Phase 4: UI Components (Est. 5-6 hours)

**Step 4.1: Exercise Screen Component**
- Display current exercise number
- Show Chinese characters (large, centered)
- Input field for pinyin
- Submit and Report buttons
- Handle keyboard shortcuts

**Step 4.2: Feedback Screen Component**
- Show score badge
- Display comparison view (aligned)
- List error details
- Next button

**Step 4.3: Report Screen Component**
- Show session statistics
- Display error breakdown
- Show common mistakes
- Provide suggestions
- Start new session button

**Step 4.4: Reusable Components**
- `CharacterDisplay.tsx`: Styled character box
- `PinyinInput.tsx`: Input with validation
- `ComparisonView.tsx`: Aligned pinyin comparison

**Deliverable**: Complete UI with all screens functional

---

### Phase 5: Integration & Polish (Est. 3-4 hours)

**Step 5.1: Connect All Components**
- Wire up state management to all screens
- Ensure proper transitions
- Test complete user flow

**Step 5.2: Add Keyboard Shortcuts**
- Create `useKeyboardShortcuts.ts` hook
- Implement Enter, Escape, Cmd+R shortcuts

**Step 5.3: Responsive Design**
- Test on mobile viewport
- Adjust spacing and font sizes
- Ensure touch targets are adequate

**Step 5.4: Error Handling**
- Graceful handling of parsing errors
- User-friendly error messages
- Fallback states

**Step 5.5: Performance Optimization**
- Memoize expensive computations
- Optimize re-renders
- Lazy load components if needed

**Deliverable**: Fully functional, polished MVP

---

### Phase 6: Testing & Deployment (Est. 2-3 hours)

**Step 6.1: Manual Testing**
- Test complete session flow
- Test various error scenarios
- Test report generation
- Cross-browser testing

**Step 6.2: Build for Production**
```bash
npm run build
```

**Step 6.3: Deploy**
- Option A: Deploy to Vercel
  ```bash
  npm install -g vercel
  vercel
  ```
- Option B: Deploy to Netlify (drag & drop `dist/` folder)
- Option C: Deploy to GitHub Pages

**Step 6.4: Documentation**
- Write README.md with setup instructions
- Document any known issues
- Create user guide (optional)

**Deliverable**: Live, deployed application

---

## 7. Future Enhancements

### 7.1 Near-Term Features

1. **Sentence Building**
   - Multi-word exercises
   - Simple sentence templates
   - Grammar rules (subject-verb-object)

2. **Spaced Repetition**
   - Track individual word performance
   - Prioritize words with errors
   - Adaptive difficulty

3. **Audio Support**
   - TTS for character pronunciation
   - Listen mode exercises
   - Tone contour visualization

4. **Export/Import**
   - Export session data to CSV
   - Import custom vocabulary lists
   - Backup/restore progress

### 7.2 Advanced Features

1. **Multiple Exercise Types**
   - Pinyin → Characters
   - Audio → Pinyin
   - Audio → Characters
   - Conversational prompts

2. **Progress Dashboard**
   - Historical performance graphs
   - Word-level statistics
   - Tone accuracy heat map
   - Learning velocity metrics

3. **Customization**
   - Difficulty settings
   - Session length goals
   - Focus on specific tones/words
   - Custom sentence templates

4. **Social Features**
   - Share session reports
   - Leaderboards (optional)
   - Challenge friends

5. **Mobile App**
   - React Native port
   - Offline support
   - Push notifications for practice reminders

---

## 8. Technical Decisions & Rationale

### 8.1 Why React + TypeScript?

- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Excellent tooling and autocomplete
- **Component Model**: Naturally maps to UI screens
- **Ecosystem**: Large community, many resources
- **Scalability**: Easy to add features incrementally

### 8.2 Why Tailwind CSS?

- **Rapid Development**: No context switching between files
- **Consistency**: Built-in design system
- **Responsive**: Mobile-first utilities
- **Small Bundle**: Purges unused styles
- **No Naming**: Avoids CSS class naming debates

### 8.3 Why Vite?

- **Speed**: Instant HMR during development
- **Modern**: ESM-based, no legacy baggage
- **Simple**: Minimal configuration
- **TypeScript**: First-class support

### 8.4 Why Context + useReducer?

- **Sufficient**: Right tool for single-user app
- **Built-in**: No additional dependencies
- **Predictable**: Clear state transitions
- **Debuggable**: Easy to trace state changes

### 8.5 Alternative Considerations

| Technology | Alternative | Why Not Chosen |
|------------|-------------|----------------|
| React | Vue, Svelte | React has largest ecosystem, most resources |
| Tailwind | Styled Components, CSS Modules | Tailwind faster for prototyping, better consistency |
| Vite | Create React App | CRA is legacy, Vite is faster and more modern |
| Context | Redux, Zustand | Overkill for this scope, unnecessary complexity |
| TypeScript | JavaScript | Type safety prevents bugs, better DX |

---

## 9. Success Metrics

### 9.1 Technical Metrics

- [ ] Vocabulary parser handles all active words without errors
- [ ] Grader correctly identifies all error types (tone, syllable, missing, extra)
- [ ] App loads and renders in < 2 seconds
- [ ] No console errors during normal operation
- [ ] Responsive on mobile (320px) to desktop (1920px)

### 9.2 User Experience Metrics

- [ ] User can complete an exercise in < 30 seconds
- [ ] Feedback is immediate (< 100ms after submission)
- [ ] Error messages are clear and actionable
- [ ] Report provides useful insights
- [ ] Keyboard shortcuts work as expected

### 9.3 Learning Metrics

- [ ] User can identify tone errors from report
- [ ] User can track improvement over sessions
- [ ] Common mistakes are surfaced clearly
- [ ] Suggestions are actionable and specific

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vocabulary parsing fails | High | Low | Extensive testing, fallback data |
| Pinyin grading inaccurate | High | Medium | Comprehensive test cases, manual validation |
| Poor mobile UX | Medium | Medium | Mobile-first design, early testing |
| Sentence building too complex | Medium | High | Start with single words, iterate gradually |
| Performance issues | Low | Low | React optimization, code splitting |
| User confusion | Medium | Medium | Clear instructions, tooltips, onboarding |

---

## 11. Open Questions

1. **Should we support tone marks (ā, á, ǎ, à) in addition to tone numbers?**
   - Recommendation: Start with tone numbers only (simpler parsing), add tone marks as enhancement

2. **Should we persist session data across browser sessions?**
   - Recommendation: Yes, use localStorage for sessions in last 7 days

3. **How many exercises should a "typical" session include?**
   - Recommendation: No limit, user-driven with report on demand

4. **Should we randomize word selection or use a specific algorithm?**
   - Recommendation: Start with random, add spaced repetition in Phase 2

5. **Should we allow editing answers after submission?**
   - Recommendation: No, encourages careful review before submission

---

## 12. Conclusion

This design provides a **clear, actionable roadmap** for building a focused Mandarin pinyin practice app that:

- ✅ Aligns with your learning framework (character → pinyin reproduction)
- ✅ Uses only your active vocabulary
- ✅ Provides immediate, detailed feedback
- ✅ Tracks tone errors as first-class problems
- ✅ Generates useful performance insights
- ✅ Scales from MVP to advanced features

The phased implementation approach allows you to:
1. **Build quickly**: MVP in 20-25 hours
2. **Validate early**: Test core functionality before adding features
3. **Iterate safely**: Add enhancements incrementally
4. **Learn progressively**: Build technical skills alongside language skills

**Recommended First Step**: Start with Phase 1 (Project Setup) and Phase 2 (Data Layer), ensuring vocabulary parsing works correctly before building UI.

---

## Appendix A: Quick Start Commands

```bash
# Create project
npm create vite@latest chinese-learning-app -- --template react-ts
cd chinese-learning-app

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Appendix B: Key Files to Create (in order)

1. `src/types/vocabulary.ts` - Type definitions
2. `src/lib/vocabularyParser.ts` - Parse markdown file
3. `src/lib/exerciseGenerator.ts` - Generate exercises
4. `src/lib/pinyinGrader.ts` - Grade answers
5. `src/contexts/ExerciseContext.tsx` - State management
6. `src/components/ExerciseScreen.tsx` - Main screen
7. `src/components/FeedbackScreen.tsx` - Feedback screen
8. `src/components/ReportScreen.tsx` - Report screen
9. `src/App.tsx` - Wire everything together

---

**Document Version**: 1.0
**Last Updated**: 2026-01-05
**Status**: Ready for Implementation
