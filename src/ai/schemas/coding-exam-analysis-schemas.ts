
import {z} from 'genkit';

const ProblemAnalysisSchema = z.object({
  title: z.string().describe("The title of the coding problem."),
  averageScore: z.number().describe("The average score achieved by students on this problem."),
  submissionCount: z.number().describe("The total number of students who submitted a solution for this problem."),
});

const StudentPerformanceSchema = z.object({
  userName: z.string().describe("The name of the student."),
  totalScore: z.number().describe("The student's total score across all problems in the exam."),
});

export const CodingExamAnalysisInputSchema = z.object({
  examTitle: z.string().describe('The title of the coding exam.'),
  problemAnalytics: z
    .array(ProblemAnalysisSchema)
    .describe('An array of objects representing the performance analysis for each problem in the exam.'),
  studentPerformances: z
    .array(StudentPerformanceSchema)
    .describe('An array of objects representing the overall performance of each student in the exam.'),
});
export type CodingExamAnalysisInput = z.infer<typeof CodingExamAnalysisInputSchema>;

export const CodingExamAnalysisOutputSchema = z.object({
  analysisSummary: z.string().describe('A comprehensive summary and analysis of the coding exam performance.'),
});
export type CodingExamAnalysisOutput = z.infer<typeof CodingExamAnalysisOutputSchema>;
