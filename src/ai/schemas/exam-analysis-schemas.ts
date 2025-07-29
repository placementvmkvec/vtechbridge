
import {z} from 'genkit';

const QuestionAnalysisSchema = z.object({
  questionText: z.string(),
  correct: z.number(),
  incorrect: z.number(),
  total: z.number(),
});

const StudentPerformanceSchema = z.object({
  userName: z.string(),
  percentage: z.number(),
});

export const ExamAnalysisInputSchema = z.object({
  examTitle: z.string().describe('The title of the exam.'),
  passPercentage: z.number().describe('The pass percentage for the exam.'),
  questionAnalytics: z
    .array(QuestionAnalysisSchema)
    .describe('An array of objects representing the performance of each question.'),
  studentPerformances: z
    .array(StudentPerformanceSchema)
    .describe('An array of objects representing the performance of each student.'),
});
export type ExamAnalysisInput = z.infer<typeof ExamAnalysisInputSchema>;

export const ExamAnalysisOutputSchema = z.object({
  analysisSummary: z.string().describe('A comprehensive summary and analysis of the exam performance.'),
});
export type ExamAnalysisOutput = z.infer<typeof ExamAnalysisOutputSchema>;
