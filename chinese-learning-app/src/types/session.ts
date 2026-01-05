import type { ExerciseAttempt } from './exercise';

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
  commonMistakes: Record<string, number>;
}
