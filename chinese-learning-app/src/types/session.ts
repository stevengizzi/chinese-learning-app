import type { ExerciseAttempt, ExerciseType, PlayMode } from './exercise';

export interface Session {
  id: string;
  exerciseType: ExerciseType;
  playMode: PlayMode;
  startTime: number;
  endTime?: number;
  attempts: ExerciseAttempt[];
  statistics: SessionStatistics;
  remainingWords?: string[];  // For complete-all mode
}

export interface SessionStatistics {
  totalExercises: number;
  totalCharacters: number;
  correctCharacters: number;
  averageAccuracy: number;
  toneErrors: number;
  syllableErrors: number;
  commonMistakes: Record<string, number>;
}
