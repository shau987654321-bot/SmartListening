import { QuizData, QuizAttempt } from '../types';
import localforage from 'localforage';

const QUIZZES_KEY = 'linguaListen_quizzes';
const ATTEMPTS_KEY = 'linguaListen_attempts';

export const storageService = {
  // Save a new quiz (Teacher)
  saveQuiz: async (quiz: QuizData): Promise<void> => {
    const existing = await storageService.getQuizzes();
    const updated = [quiz, ...existing];
    await localforage.setItem(QUIZZES_KEY, updated);
  },

  // Get all available quizzes (Student/Teacher)
  getQuizzes: async (): Promise<QuizData[]> => {
    const data: QuizData[] | null = await localforage.getItem(QUIZZES_KEY);
    return data || [];
  },

  // Delete a quiz (Teacher)
  deleteQuiz: async (quizId: string): Promise<void> => {
    const existing = await storageService.getQuizzes();
    const updated = existing.filter(q => q.id !== quizId);
    await localforage.setItem(QUIZZES_KEY, updated);
  },

  // Save a student's attempt (Student)
  saveAttempt: async (attempt: QuizAttempt): Promise<void> => {
    const existing = await storageService.getAttempts();
    const updated = [attempt, ...existing];
    await localforage.setItem(ATTEMPTS_KEY, updated);
  },

  // Get all attempts (Teacher view)
  getAttempts: async (): Promise<QuizAttempt[]> => {
    const data: QuizAttempt[] | null = await localforage.getItem(ATTEMPTS_KEY);
    return data || [];
  },

  // Get attempts for a specific student (Student view)
  getStudentAttempts: async (studentName: string): Promise<QuizAttempt[]> => {
    const attempts = await storageService.getAttempts();
    return attempts.filter(a => a.studentName === studentName);
  },
  
  // Get attempts for a specific quiz (Teacher detailed view)
  getQuizAttempts: async (quizId: string): Promise<QuizAttempt[]> => {
    const attempts = await storageService.getAttempts();
    return attempts.filter(a => a.quizId === quizId);
  }
};