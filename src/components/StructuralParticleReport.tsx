import type { StructuralParticleSession, StructuralParticleItem, StructuralParticle } from '../types/structuralParticle';
import { ALL_STRUCTURAL_PARTICLES, PARTICLE_INFO } from '../types/structuralParticle';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';

interface StructuralParticleReportProps {
  session: StructuralParticleSession;
  items: StructuralParticleItem[];
  onBackToMenu: () => void;
  onNewSession: () => void;
}

interface ParticleStats {
  total: number;
  correct: number;
  avgTimeMs: number;
}

export function StructuralParticleReport({
  session,
  items,
  onBackToMenu,
  onNewSession,
}: StructuralParticleReportProps) {
  const { attempts, startTime, endTime } = session;

  // Calculate overall stats
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.isCorrect).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const totalTimeMs = endTime ? endTime - startTime : Date.now() - startTime;
  const avgTimePerItem = totalAttempts > 0 ? totalTimeMs / totalAttempts : 0;

  // Calculate stats by particle type
  const statsByParticle: Record<StructuralParticle, ParticleStats> = {} as Record<StructuralParticle, ParticleStats>;

  for (const particle of ALL_STRUCTURAL_PARTICLES) {
    const particleAttempts = attempts.filter(a => a.particle === particle);
    const particleCorrect = particleAttempts.filter(a => a.isCorrect).length;
    const particleTotalTime = particleAttempts.reduce((sum, a) => sum + a.timeMs, 0);

    statsByParticle[particle] = {
      total: particleAttempts.length,
      correct: particleCorrect,
      avgTimeMs: particleAttempts.length > 0 ? particleTotalTime / particleAttempts.length : 0,
    };
  }

  // Get problem items (incorrect answers)
  const problemAttempts = attempts.filter(a => !a.isCorrect);

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Get item by ID
  const getItem = (itemId: string): StructuralParticleItem | undefined => {
    return items.find(item => item.id === itemId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Structural Particles: 的, 地, 得
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Accuracy
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                {correctAttempts}/{totalAttempts}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Correct
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {formatDuration(totalTimeMs)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Total Time
              </div>
            </div>
          </div>

          {/* Stats by Particle Type */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Performance by Particle
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {ALL_STRUCTURAL_PARTICLES.map(particle => {
                const stats = statsByParticle[particle];
                if (stats.total === 0) return null;

                const particleAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                const info = PARTICLE_INFO[particle];

                return (
                  <div
                    key={particle}
                    className={`p-4 rounded-lg border-2 ${info.color.bg} ${info.color.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-bold ${info.color.text}`}>
                        {particle}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.correct}/{stats.total}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${info.color.text}`}>
                      {particleAccuracy.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {formatTime(stats.avgTimeMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem Items */}
          {problemAttempts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Items to Review ({problemAttempts.length})
              </h2>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {problemAttempts.map((attempt, index) => {
                  const item = getItem(attempt.itemId);
                  if (!item) return null;

                  const info = PARTICLE_INFO[attempt.particle];

                  return (
                    <div
                      key={`${attempt.itemId}-${index}`}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.baseElements} → {item.englishHint}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg text-gray-900 dark:text-white">
                              {item.chineseAnswer}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {convertPinyinStringToToneMarks(item.pinyin)}
                            </span>
                          </div>
                          {attempt.userAnswer && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Your answer: {attempt.userAnswer}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-lg px-2 py-0.5 rounded ${info.color.bg} ${info.color.text} ${info.color.border} border`}
                        >
                          {attempt.particle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Average response time */}
          <div className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Average response time: <span className="font-semibold">{formatTime(avgTimePerItem)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBackToMenu}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Back to Menu
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
