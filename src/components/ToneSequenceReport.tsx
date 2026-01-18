import type { ToneSequenceSession } from '../types/toneSequence';

interface ToneSequenceReportProps {
  session: ToneSequenceSession;
  onBackToMenu: () => void;
  onNewSession: () => void;
}

export function ToneSequenceReport({
  session,
  onBackToMenu,
  onNewSession,
}: ToneSequenceReportProps) {
  const durationMs = session.endTime
    ? session.endTime - session.startTime
    : Date.now() - session.startTime;

  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);

  const activeTonesList = Array.from(session.config.activeTones).sort().join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">📊</span>
              <span>Tone Sequence Session Report</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Session completed successfully</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center">
              <div className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-2">
                Sequences Completed
              </div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">
                {session.sequencesCompleted}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 text-center">
              <div className="text-sm text-green-600 dark:text-green-300 font-medium mb-2">
                Total Duration
              </div>
              <div className="text-3xl font-bold text-green-700 dark:text-green-200">
                {durationMinutes}m {durationSeconds}s
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 text-center">
              <div className="text-sm text-purple-600 dark:text-purple-300 font-medium mb-2">
                Average BPM
              </div>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-200">
                {session.config.bpm}
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Session Configuration
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Active Tones:</span>
                <span className="text-gray-900 dark:text-white">{activeTonesList}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Sequence Length:</span>
                <span className="text-gray-900 dark:text-white">{session.config.sequenceLength} syllables</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Difficulty Range:</span>
                <span className="text-gray-900 dark:text-white">
                  {session.config.difficultyRange[0]} – {session.config.difficultyRange[1]}
                </span>
              </div>
              {session.config.excludedSyllables.size > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Excluded Syllables:</span>
                  <span className="text-gray-900 dark:text-white">
                    {Array.from(session.config.excludedSyllables).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Sandhi Rules:</span>
                <span className="text-gray-900 dark:text-white">
                  {session.config.sandhiRules.filter(r => r.enabled).length} enabled
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBackToMenu}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              ← Back to Menu
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
