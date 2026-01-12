# Response Time Tracking & Speed Training Implementation Plan

## Overview
Add comprehensive response time tracking for each vocabulary entry and a new "Speed Training" mode that targets slower vocabulary items to improve overall response speed.

## 1. Data Model & Storage

### 1.1 New Types (`src/types/responseTracking.ts`)

```typescript
// Individual response record
interface ResponseRecord {
  vocabularyId: string;        // Unique ID for vocab entry (e.g., "character-pinyin")
  character: string;            // The Chinese character
  exerciseType: ExerciseType;  // Type of exercise
  responseTimeMs: number;       // Time taken to respond
  wasCorrect: boolean;          // Whether answer was correct
  timestamp: number;            // When this occurred
}

// Aggregated statistics for a vocabulary entry
interface VocabularySpeedStats {
  vocabularyId: string;
  character: string;
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;  // Only for correct answers
  fastestResponseMs: number;
  slowestResponseMs: number;
  lastAttemptTimestamp: number;
  recentResponseTimes: number[];  // Last 10 correct response times
}

// Database structure
interface ResponseDatabase {
  version: number;  // For future migrations
  records: ResponseRecord[];
  statistics: Record<string, VocabularySpeedStats>;  // Key: vocabularyId
  lastUpdated: number;
}
```

### 1.2 Storage Strategy

**File-based JSON storage** in `public/data/response-tracking.json`:
- Pros: Simple, no backend needed, git-trackable, human-readable
- Cons: Manual commit/push workflow, file size could grow (mitigated by aggregation)
- Alternative considered: IndexedDB (rejected - not git-trackable, harder to backup)

**Data Management:**
- Keep last 1000 raw records (rolling window)
- Aggregate older records into statistics only
- Compress/archive old data periodically (manual)

### 1.3 Persistence Layer (`src/lib/responseTracking/storage.ts`)

```typescript
class ResponseTrackingStorage {
  private static DB_URL = `${import.meta.env.BASE_URL}data/response-tracking.json`;
  private database: ResponseDatabase | null = null;

  async loadDatabase(): Promise<ResponseDatabase>
  async saveDatabase(db: ResponseDatabase): Promise<void>

  // Note: Actual file writes require manual git commit/push
  // In-memory changes are saved to localStorage as cache
  // User prompted to commit changes periodically
}
```

## 2. Response Time Measurement

### 2.1 Tracking in ExerciseContext

**Add to Session type:**
```typescript
interface Session {
  // ... existing fields
  exerciseStartTime?: number;  // When current exercise was shown
  responseTimings: Array<{
    vocabularyId: string;
    character: string;
    responseTimeMs: number;
    wasCorrect: boolean;
  }>;
}
```

**Timing Logic:**
- Start timer when exercise displays (`NEXT_EXERCISE` or start of session)
- Stop timer when user submits answer (`SUBMIT_ANSWER`)
- Calculate: `responseTimeMs = submitTime - exerciseStartTime`
- Only count correct answers for speed statistics
- Store timing data in session

### 2.2 Recording Flow

1. Exercise shown → Start timer
2. User submits → Calculate response time
3. If correct → Add to responseTimings array
4. On session end → Batch save all timings to database
5. Prompt user to commit changes if significant data added

## 3. Speed Training Mode ("Speed Drill")

### 3.1 Name: "Speed Drill"
**Rationale:**
- "Speed" clearly indicates the focus
- "Drill" implies repetitive practice for improvement
- Distinct from existing "Drill Mode" which focuses on correctness

### 3.2 Algorithm

```typescript
function selectSpeedDrillExercise(
  vocabulary: VocabularyData,
  statistics: Record<string, VocabularySpeedStats>,
  exerciseType: ExerciseType
): VocabularyEntry {

  // 1. Calculate global average (correct answers only)
  const globalAverage = calculateAverageResponseTime(statistics);

  // 2. Filter to entries slower than average
  const slowEntries = vocabulary.active.filter(entry => {
    const stats = statistics[generateVocabId(entry)];
    return stats && stats.averageResponseTimeMs > globalAverage;
  });

  // 3. If no slow entries, use all entries
  const targetPool = slowEntries.length > 0 ? slowEntries : vocabulary.active;

  // 4. Weight selection by response time (slower = higher probability)
  return weightedRandomSelection(targetPool, statistics);
}
```

**Weighting Formula:**
```
weight = (responseTime / globalAverage) ^ 2
```
- Entries 2x slower than average are 4x more likely to appear
- Entries at average speed have weight of 1
- Provides progressive focus on slowest items

### 3.3 UI Integration

**Main Menu:**
```
[Exercise Type Card]
  ├─ Endless Practice
  ├─ Complete All
  ├─ Drill Mode
  └─ Speed Drill ⚡  (NEW)
      └─ Description: "Focus on improving response speed for slower vocabulary"
      └─ Shows: Current avg speed, target improvement
```

**During Exercise:**
- Show response time after each answer (e.g., "1.2s - Good!" or "3.5s - Too slow")
- Color-coded feedback:
  - Green: Faster than average
  - Yellow: Near average
  - Red: Slower than average
- Running average display at top of screen

**Report Screen:**
- Speed improvement metrics
- Fastest/slowest words in session
- Comparison to previous sessions
- Progress chart (if multiple sessions)

## 4. Statistics & Analytics

### 4.1 New Utility Functions (`src/lib/responseTracking/analytics.ts`)

```typescript
// Calculate global average (correct answers only)
function calculateGlobalAverage(stats: Record<string, VocabularySpeedStats>): number

// Identify slowest N entries
function getSlowestEntries(stats: Record<string, VocabularySpeedStats>, count: number): VocabularySpeedStats[]

// Calculate improvement over time
function calculateImprovement(
  current: VocabularySpeedStats,
  historical: ResponseRecord[]
): { percentImprovement: number; trend: 'improving' | 'stable' | 'declining' }

// Generate performance report
function generateSpeedReport(session: Session, stats: Record<string, VocabularySpeedStats>): SpeedReport
```

### 4.2 Vocabulary ID Generation

**Format:** `{character}:{pinyin}:{meaning}`
- Ensures uniqueness across vocabulary entries
- Allows tracking same character with different meanings separately
- Example: `你好:ni3 hao3:hello`

## 5. Data Persistence Workflow

### 5.1 Auto-save Strategy
1. Save to localStorage immediately after each session (as cache)
2. Write to JSON file every 10 exercises or when user ends session
3. Prompt user: "You have unsaved response time data. Commit changes?"

### 5.2 Git Integration Helper (`src/lib/responseTracking/gitHelper.ts`)

```typescript
// Generate commit message with statistics
function generateCommitMessage(
  addedRecords: number,
  improvedEntries: string[]
): string {
  return `Update response time data: ${addedRecords} new records\n\n` +
         `Improved entries: ${improvedEntries.join(', ')}`;
}
```

**User Workflow:**
1. Complete exercises
2. See notification: "5 new response times recorded"
3. Click "Save & Commit" button
4. Data written to JSON file
5. User manually commits via git or Claude Code can assist

### 5.3 Migration Strategy

**Initial Load:**
- Check if `response-tracking.json` exists
- If not, create with empty database
- If exists, load and validate structure
- Handle version upgrades gracefully

## 6. UI Components

### 6.1 New Components

**`src/components/SpeedFeedback.tsx`**
- Shows response time after each answer
- Color-coded performance indicator
- Encouraging messages based on performance

**`src/components/SpeedStatsDashboard.tsx`**
- Overview of all vocabulary speed statistics
- Sortable table (by speed, attempts, etc.)
- Filterable by exercise type
- Accessible from main menu

**`src/components/SpeedReport.tsx`**
- Session-specific speed report
- Replaces or augments existing ReportScreen for Speed Drill mode
- Charts showing improvement over time
- Comparison to global averages

### 6.2 Modified Components

**`MainMenu.tsx`:**
- Add "Speed Drill" button to each exercise type
- Show user's current global average prominently
- Indicate number of vocabulary entries tracked

**`FeedbackScreen.tsx`:**
- Add speed feedback for Speed Drill mode
- Show whether response was faster/slower than average
- Optional: Show for all modes, highlighted in Speed Drill

**`ReportScreen.tsx`:**
- Add speed statistics section
- Link to detailed speed dashboard
- Show session timing data

## 7. Implementation Phases

### Phase 1: Core Infrastructure (Priority)
1. Create type definitions
2. Implement storage layer
3. Add timing measurement to ExerciseContext
4. Create analytics utilities
5. Test data persistence

### Phase 2: Speed Drill Mode
1. Implement selection algorithm
2. Add "Speed Drill" play mode to types
3. Update ExerciseContext to handle speed drill
4. Test weighted selection

### Phase 3: UI & Feedback
1. Create SpeedFeedback component
2. Update FeedbackScreen with speed display
3. Create SpeedReport component
4. Add speed statistics to ReportScreen
5. Style and polish

### Phase 4: Dashboard & Analytics
1. Create SpeedStatsDashboard component
2. Add navigation to dashboard from menu
3. Implement data visualization (charts)
4. Add export functionality

### Phase 5: Integration & Polish
1. Add "Speed Drill" to MainMenu
2. Update high scores to include speed metrics
3. Add commit helper prompts
4. Write documentation
5. Testing across all modes

## 8. Technical Considerations

### 8.1 Performance
- Lazy load response database (only when needed)
- Cache statistics in memory during session
- Batch writes to minimize file I/O
- Consider compression for large datasets (future)

### 8.2 Data Integrity
- Validate JSON structure on load
- Handle corrupted data gracefully (fallback to empty DB)
- Regular backups (user responsibility)
- Version field allows future migrations

### 8.3 Privacy & Storage
- All data stored locally (no external tracking)
- User owns their data completely
- Easy to export/import (JSON format)
- Can be checked into git for backup/sync

### 8.4 Edge Cases
- No previous data → Use all vocabulary equally
- Single data point → No average to compare (use global across all types)
- All entries equally slow → Random selection
- Database file missing → Create new, don't crash

## 9. Files to Create

```
src/types/responseTracking.ts
src/lib/responseTracking/storage.ts
src/lib/responseTracking/analytics.ts
src/lib/responseTracking/gitHelper.ts
src/components/SpeedFeedback.tsx
src/components/SpeedStatsDashboard.tsx
src/components/SpeedReport.tsx
public/data/response-tracking.json (initially empty)
public/data/.gitkeep
```

## 10. Files to Modify

```
src/types/exercise.ts (add 'speed-drill' PlayMode)
src/types/session.ts (add timing fields)
src/contexts/ExerciseContext.tsx (add timing logic)
src/components/MainMenu.tsx (add Speed Drill buttons)
src/components/FeedbackScreen.tsx (add speed display)
src/components/ReportScreen.tsx (add speed stats)
src/lib/exerciseGenerator.ts (add speed drill selection)
```

## 11. Success Metrics

**For Users:**
- Measurable improvement in response times over sessions
- Clear visibility into which words are "slow"
- Satisfying progression as averages decrease

**For Implementation:**
- < 100ms overhead for timing measurement
- < 1MB JSON file for 10,000 records
- No crashes from corrupted/missing data
- Smooth git workflow for data persistence

## 12. Future Enhancements (Not in Initial Scope)

- Charts showing improvement over time (line graphs)
- Comparison with "ideal" response times by HSK level
- Streaks for consecutive fast responses
- Gamification (achievements, badges)
- Export to CSV for external analysis
- Multi-device sync via git
- AI-powered recommendations for practice patterns

---

## Summary

This implementation provides:
✅ Comprehensive response time tracking per vocabulary entry
✅ Persistent storage via git-trackable JSON
✅ Intelligent "Speed Drill" mode targeting slow vocabulary
✅ Rich analytics and feedback
✅ Minimal overhead and complexity
✅ User owns their data completely

**Estimated Implementation Time:** 4-6 hours across 5 phases
**Risk Level:** Low (isolated changes, graceful degradation)
**User Impact:** High (valuable new training mode + metrics)
