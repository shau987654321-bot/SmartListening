export type QuestionType = 'Multiple Choice' | 'Fill-in-the-Blank' | 'Short Answer' | 'True/False';

export type Role = 'TEACHER' | 'STUDENT';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correct_answer: string;
  transcript_reference?: string;
}

export interface QuizData {
  id: string; // Unique ID for the quiz
  accessCode: string; // 6-digit code for joining
  createdDate: string;
  publishedAt: string; // Date when the quiz becomes available
  quiz_title: string;
  language: string;
  difficulty: Difficulty;
  transcript: string;
  questions: Question[];
  mediaData?: string; // Base64 Data URL for the audio/video file
  mediaType?: string; // MIME type
  replayLimit?: number; // Number of allowed plays (undefined/0 = unlimited)
  timeLimit?: number; // Time limit in minutes (undefined/0 = unlimited)
}

export interface UserResponse {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface QuizAttempt {
  id: string;
  date: string;
  quizId: string;
  quizTitle: string;
  studentName: string; // Identify the student
  score: number;
  totalQuestions: number;
  language: string;
  difficulty: string;
}

export enum AppState {
  ROLE_SELECTION = 'ROLE_SELECTION',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
  PROCESSING = 'PROCESSING',
  TAKING_QUIZ = 'TAKING_QUIZ',
  RESULTS = 'RESULTS'
}