export type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number; // in minutes
  questions: Question[];
};

export const MOCK_QUESTIONS: Question[] = [];


export const MOCK_EXAMS: Exam[] = [];

export const MOCK_USER_RESULTS: any[] = [];
