# Speed Training Implementation Status

## ✅ Completed: Phase 1 - Core Infrastructure

### What's Done
1. **Type Definitions** (`src/types/responseTracking.ts`)
   - ResponseRecord, VocabularySpeedStats, ResponseDatabase
   - SpeedPerformance, SpeedReport types
   - Added 'speed-drill' to PlayMode

2. **Storage Layer** (`src/lib/responseTracking/storage.ts`)
   - Load/save database from JSON with localStorage cache
   - Add response records with auto-aggregation
   - Calculate global averages
   - Export functionality

3. **Analytics** (`src/lib/responseTracking/analytics.ts`)
   - Get slowest/fastest entries
   - Performance level calculation
   - Speed report generation
   - Formatting utilities

4. **Timing in ExerciseContext** (`src/contexts/ExerciseContext.tsx`)
   - Track exerciseStartTime
   - Calculate responseTimeMs on submission
   - Store in session.responseTimings
   - Speed-drill mode support in reducer

5. **Data Files**
   - `public/data/response-tracking.json` (empty template)
   - `public/data/.gitkeep`

### Git Status
- **Commit:** `50f5531` - "Phase 1: Core infrastructure for response time tracking and Speed Drill mode"
- **Branch:** main
- **Pushed:** Yes

---

## 🚧 TODO: Remaining Phases

### Phase 2: Speed Drill Selection Algorithm

**File to modify:** `src/lib/exerciseGenerator.ts`

Add weighted selection for speed-drill mode:

```typescript
import { loadResponseDatabase, calculateGlobalAverage, generateVocabularyId } from './responseTracking/storage';
import { getSlowerThanAverageEntries } from './responseTracking/analytics';

// Inside generateExercise function, add case for speed-drill:
if (playMode === 'speed-drill') {
  // Load response database
  const database = await loadResponseDatabase();
  const globalAverage = calculateGlobalAverage(database);

  // Get entries slower than average
  const slowEntries = getSlowerThanAverageEntries(database);

  // Create map of vocabulary to stats
  const statsMap = new Map();
  slowEntries.forEach(stat => {
    const vocab = vocabulary.find(v =>
      generateVocabularyId(v.word, v.pinyin, v.meaning) === stat.vocabularyId
    );
    if (vocab) statsMap.set(vocab, stat);
  });

  // Use slow entries if available, otherwise all vocabulary
  const targetPool = slowEntries.length > 0
    ? Array.from(statsMap.keys())
    : vocabulary;

  // Weighted random selection
  if (statsMap.size > 0) {
    const weights = targetPool.map(v => {
      const stats = statsMap.get(v);
      if (!stats) return 1;
      const ratio = stats.averageResponseTimeMs / globalAverage;
      return Math.pow(ratio, 2); // Square for emphasis
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < targetPool.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedVocab = targetPool[i];
        break;
      }
    }
  } else {
    selectedVocab = targetPool[Math.floor(Math.random() * targetPool.length)];
  }
}
```

**Note:** May need to make `generateExercise` async or handle loading differently.

---

### Phase 3: UI Components

#### 3.1 SpeedFeedback Component

**File to create:** `src/components/SpeedFeedback.tsx`

```typescript
import { useEffect, useState } from 'react';
import { loadResponseDatabase, calculateGlobalAverage } from '../lib/responseTracking/storage';
import {
  getSpeedPerformance,
  getPerformanceColor,
  getPerformanceMessage,
  formatResponseTime
} from '../lib/responseTracking/analytics';

interface SpeedFeedbackProps {
  responseTimeMs: number;
  wasCorrect: boolean;
}

export function SpeedFeedback({ responseTimeMs, wasCorrect }: SpeedFeedbackProps) {
  const [globalAverage, setGlobalAverage] = useState(2000);

  useEffect(() => {
    loadResponseDatabase().then(db => {
      setGlobalAverage(calculateGlobalAverage(db));
    });
  }, []);

  if (!wasCorrect) {
    return null; // Only show speed feedback for correct answers
  }

  const performance = getSpeedPerformance(responseTimeMs, globalAverage);
  const colorClass = getPerformanceColor(performance);
  const message = getPerformanceMessage(performance);

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${
      performance === 'excellent' ? 'bg-green-50 border-green-300' :
      performance === 'good' ? 'bg-blue-50 border-blue-300' :
      performance === 'average' ? 'bg-yellow-50 border-yellow-300' :
      performance === 'slow' ? 'bg-orange-50 border-orange-300' :
      'bg-red-50 border-red-300'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-semibold ${colorClass}`}>
            {message}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Response time: {formatResponseTime(responseTimeMs)}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Average: {formatResponseTime(globalAverage)}</div>
          <div className={colorClass}>
            {responseTimeMs < globalAverage ? '↓ Faster' : '↑ Slower'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 Update FeedbackScreen

**File to modify:** `src/components/FeedbackScreen.tsx`

Add SpeedFeedback component after existing feedback:

```typescript
import { SpeedFeedback } from './SpeedFeedback';

// Inside component, after error display:
{state.currentSession && state.currentAttempt && (
  <SpeedFeedback
    responseTimeMs={
      state.currentSession.responseTimings[
        state.currentSession.responseTimings.length - 1
      ]?.responseTimeMs || 0
    }
    wasCorrect={state.currentAttempt.score.correct === state.currentAttempt.score.total}
  />
)}
```

#### 3.3 Update ReportScreen

**File to modify:** `src/components/ReportScreen.tsx`

Add speed statistics section:

```typescript
import { useEffect, useState } from 'react';
import { loadResponseDatabase } from '../lib/responseTracking/storage';
import { generateSpeedReport, formatResponseTime } from '../lib/responseTracking/analytics';
import type { SpeedReport } from '../types/responseTracking';

// Inside component:
const [speedReport, setSpeedReport] = useState<SpeedReport | null>(null);

useEffect(() => {
  if (state.currentSession) {
    loadResponseDatabase().then(db => {
      const report = generateSpeedReport(state.currentSession!, db);
      setSpeedReport(report);
    });
  }
}, [state.currentSession]);

// Add after existing statistics:
{speedReport && (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
      Speed Performance
    </h2>
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
        <div className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-1">
          Session Average
        </div>
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">
          {formatResponseTime(speedReport.sessionAverageMs)}
        </div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
        <div className="text-sm text-green-600 dark:text-green-300 font-medium mb-1">
          Fastest
        </div>
        <div className="text-2xl font-bold text-green-700 dark:text-green-200">
          {formatResponseTime(speedReport.fastestResponseMs)}
        </div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 text-center">
        <div className="text-sm text-purple-600 dark:text-purple-300 font-medium mb-1">
          Improvement
        </div>
        <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">
          {speedReport.improvement > 0 ? '+' : ''}{speedReport.improvement.toFixed(1)}%
        </div>
      </div>
    </div>

    {/* Fastest/Slowest entries */}
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fastest Responses</h3>
        <ul className="space-y-1">
          {speedReport.fastestEntries.slice(0, 3).map((entry, i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
              {entry.character}: {formatResponseTime(entry.timeMs)}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Slowest Responses</h3>
        <ul className="space-y-1">
          {speedReport.slowestEntries.slice(0, 3).map((entry, i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
              {entry.character}: {formatResponseTime(entry.timeMs)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

---

### Phase 4: MainMenu Integration

**File to modify:** `src/components/MainMenu.tsx`

Add Speed Drill button to each exercise type:

```typescript
// In playModes array, add:
{
  mode: 'speed-drill',
  name: 'Speed Drill ⚡',
  description: 'Focus on improving response speed for slower vocabulary'
}

// The existing map will automatically render it
```

---

### Phase 5: Data Persistence & Saving

#### 5.1 Save on Session End

**File to modify:** `src/contexts/ExerciseContext.tsx`

In `REQUEST_REPORT` case, add:

```typescript
import { loadResponseDatabase, addResponseRecords, saveResponseDatabase } from '../lib/responseTracking/storage';

// After calculating final statistics:
if (state.currentSession.responseTimings.length > 0) {
  loadResponseDatabase().then(db => {
    const records = state.currentSession.responseTimings.map(timing => ({
      vocabularyId: timing.vocabularyId,
      character: timing.character,
      pinyin: timing.pinyin,
      meaning: timing.meaning,
      exerciseType: state.currentSession.exerciseType,
      responseTimeMs: timing.responseTimeMs,
      wasCorrect: timing.wasCorrect
    }));

    const updatedDb = addResponseRecords(db, records);
    saveResponseDatabase(updatedDb);

    console.log(`Saved ${records.length} response time records`);
  });
}
```

#### 5.2 User Prompt for Committing

**File to create:** `src/components/ResponseDataCommitPrompt.tsx`

```typescript
import { useEffect, useState } from 'react';
import { loadResponseDatabase, exportDatabaseJSON } from '../lib/responseTracking/storage';

export function ResponseDataCommitPrompt() {
  const [recordCount, setRecordCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    loadResponseDatabase().then(db => {
      setRecordCount(db.records.length);
      // Show prompt if more than 50 records since last update
      if (db.records.length > 50) {
        setShowPrompt(true);
      }
    });
  }, []);

  const handleExport = async () => {
    const db = await loadResponseDatabase();
    const json = exportDatabaseJSON(db);

    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response-tracking.json';
    a.click();
    URL.revokeObjectURL(url);

    alert('Downloaded response-tracking.json. Please replace public/data/response-tracking.json and commit the changes.');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold text-yellow-900 mb-2">
        📊 {recordCount} Response Times Recorded
      </h3>
      <p className="text-sm text-yellow-800 mb-3">
        You have unsaved response time data. Download and commit to save your progress.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Download Data
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
```

Add to `App.tsx`:

```typescript
import { ResponseDataCommitPrompt } from './components/ResponseDataCommitPrompt';

// Inside AppContent, add after vocabulary uploader:
<ResponseDataCommitPrompt />
```

---

## 🔧 Implementation Notes

### Key Challenges

1. **Async Exercise Generation**: Speed Drill selection requires loading database asynchronously
   - **Solution 1**: Load database in ExerciseContext on mount, cache in state
   - **Solution 2**: Make generateExercise async and update all call sites
   - **Recommended**: Solution 1 for simplicity

2. **Initial Data**: No response times on first use
   - **Handled**: Analytics functions check for empty data and use defaults
   - Global average defaults to 2000ms (2 seconds)
   - Speed Drill falls back to random selection

3. **localStorage vs File**: Response data in both places
   - localStorage: Real-time cache during session
   - JSON file: Persistent storage via git
   - User manually downloads and commits JSON periodically

### Testing Checklist

- [ ] Build succeeds without errors
- [ ] All exercise types work in all modes
- [ ] Speed Drill shows weighted selection (test by artificially setting slow times)
- [ ] Speed feedback displays correctly for all performance levels
- [ ] Report screen shows speed statistics
- [ ] Response times save to localStorage
- [ ] Export functionality works
- [ ] Timing accuracy is reasonable (< 100ms overhead)

---

## 📝 Quick Start for Next Session

```bash
# Check current status
git log --oneline -5
git status

# View what's been completed
cat SPEED_TRAINING_IMPLEMENTATION_STATUS.md

# Start implementing Phase 2
# Edit src/lib/exerciseGenerator.ts
# Add speed-drill selection algorithm
```

### Order of Implementation

1. **Speed Drill Algorithm** (exerciseGenerator.ts)
   - Add database loading to ExerciseContext
   - Implement weighted selection
   - Test with artificial data

2. **SpeedFeedback Component** (new file)
   - Create component
   - Add to FeedbackScreen
   - Test visual appearance

3. **ReportScreen Updates** (existing file)
   - Add speed statistics section
   - Test report generation

4. **MainMenu Integration** (existing file)
   - Add Speed Drill to playModes array
   - Test button rendering and navigation

5. **Data Persistence** (ExerciseContext + new component)
   - Save on session end
   - Add commit prompt
   - Test save/load cycle

6. **Final Testing & Polish**
   - Run full exercise flow
   - Check all modes
   - Verify data persistence
   - Test export functionality

---

## 🎯 Success Criteria

- ✅ All 4 play modes work (endless, complete-all, drill, speed-drill)
- ✅ Speed feedback shows on every correct answer
- ✅ Speed Drill targets slow vocabulary with weighted selection
- ✅ Response times save to localStorage automatically
- ✅ Export/download functionality works
- ✅ Report screen shows speed statistics
- ✅ No performance degradation (< 100ms overhead)
- ✅ Build succeeds without errors
- ✅ All TypeScript types are correct

---

## 📚 Reference Files

Key files modified or created in Phase 1:
- `src/types/responseTracking.ts`
- `src/types/exercise.ts` (added speed-drill)
- `src/types/session.ts` (added timing fields)
- `src/lib/responseTracking/storage.ts`
- `src/lib/responseTracking/analytics.ts`
- `src/contexts/ExerciseContext.tsx` (timing logic)
- `public/data/response-tracking.json`

Files to modify in remaining phases:
- `src/lib/exerciseGenerator.ts`
- `src/components/SpeedFeedback.tsx` (new)
- `src/components/FeedbackScreen.tsx`
- `src/components/ReportScreen.tsx`
- `src/components/MainMenu.tsx`
- `src/components/ResponseDataCommitPrompt.tsx` (new)
- `src/App.tsx`
