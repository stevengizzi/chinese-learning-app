import { useState, useEffect, useRef } from 'react';
import type { ToneSequenceConfig, GeneratedSequence } from '../types/toneSequence';
import { generateToneSequence } from '../lib/toneSequence/sequenceGenerator';
import { Metronome } from '../lib/toneSequence/metronome';

interface ToneSequenceExerciseProps {
  config: ToneSequenceConfig;
  onConfigChange: (config: ToneSequenceConfig) => void;
  onEnd: (sequencesCompleted: number) => void;
}

export function ToneSequenceExercise({
  config,
  onConfigChange,
  onEnd,
}: ToneSequenceExerciseProps) {
  const [currentSequence, setCurrentSequence] = useState<GeneratedSequence | null>(null);
  const [sequencesCompleted, setSequencesCompleted] = useState(0);
  const metronomeRef = useRef<Metronome | null>(null);

  // Initialize metronome and first sequence
  useEffect(() => {
    // Create metronome
    const metronome = new Metronome(config.bpm);
    metronome.start();
    metronomeRef.current = metronome;

    // Generate first sequence
    generateNext();

    // Cleanup on unmount
    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
      }
    };
  }, []);

  // Update metronome BPM when config changes
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBPM(config.bpm);
    }
  }, [config.bpm]);

  // Add Enter key handler for Next Sequence
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        generateNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [config]);

  const generateNext = () => {
    try {
      console.log('Generating sequence with config:', {
        activeTones: Array.from(config.activeTones),
        difficultyRange: config.difficultyRange,
        excludedSyllables: Array.from(config.excludedSyllables),
        sequenceLength: config.sequenceLength,
        sandhiRulesCount: config.sandhiRules.length
      });
      const sequence = generateToneSequence(config);
      console.log('Generated sequence:', sequence);
      setCurrentSequence(sequence);
      setSequencesCompleted(prev => prev + 1);
    } catch (error) {
      console.error('Error generating sequence:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Error generating sequence: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck your configuration settings.`);
    }
  };

  const handleBPMChange = (newBPM: number) => {
    const updatedConfig = { ...config, bpm: newBPM };
    onConfigChange(updatedConfig);
  };

  const handleSequenceLengthChange = (delta: number) => {
    const newLength = Math.max(2, Math.min(8, config.sequenceLength + delta));
    const updatedConfig = { ...config, sequenceLength: newLength };
    onConfigChange(updatedConfig);
    // Generate new sequence with new length immediately
    setTimeout(() => generateNext(), 0);
  };

  const handleEndExercise = () => {
    if (metronomeRef.current) {
      metronomeRef.current.stop();
    }
    onEnd(sequencesCompleted);
  };

  if (!currentSequence) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Generating sequence...</div>
      </div>
    );
  }

  const pinyinSequence = currentSequence.syllables
    .map(s => s.pinyinWithTone)
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Tone Sequence Trainer
              </h2>
              <div className="text-gray-600 text-sm">
                Sequences completed: {sequencesCompleted}
              </div>
            </div>
          </div>

          {/* Main Sequence Display */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-12">
            <div className="text-center">
              <div className="text-6xl font-normal text-gray-900 mb-6 tracking-wider">
                {pinyinSequence}
              </div>
              <div className="text-lg text-blue-700 font-medium">
                {currentSequence.sandhiExplanation}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* BPM Control */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Metronome BPM: {config.bpm}
              </label>
              <input
                type="range"
                min="60"
                max="200"
                value={config.bpm}
                onChange={e => handleBPMChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>60</span>
                <span>200</span>
              </div>
            </div>

            {/* Sequence Length Control */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sequence Length: {config.sequenceLength} syllables
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSequenceLengthChange(-1)}
                  disabled={config.sequenceLength <= 2}
                  className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  −
                </button>
                <button
                  onClick={() => handleSequenceLengthChange(1)}
                  disabled={config.sequenceLength >= 8}
                  className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={generateNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
            >
              Next Sequence
            </button>
            <button
              onClick={handleEndExercise}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
            >
              End Exercise
            </button>
          </div>

          {/* Metronome Status Indicator */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span>Metronome active at {config.bpm} BPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
