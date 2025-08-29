
import {z} from 'genkit';

const TestCaseAnalysisSchema = z.object({
  index: z.number(),
  type: z.enum(['Public', 'Private']),
  passedCount: z.number(),
  failedCount: z.number(),
});

const StudentPerformanceSchema = z.object({
  userName: z.string(),
  score: z.number(),
});

export const CodingAnalysisInputSchema = z.object({
  problemTitle: z.string().describe('The title of the coding problem.'),
  testCaseAnalytics: z
    .array(TestCaseAnalysisSchema)
    .describe('An array of objects representing the performance of each test case.'),
  studentPerformances: z
    .array(StudentPerformanceSchema)
    .describe('An array of objects representing the performance of each student.'),
});
export type CodingAnalysisInput = z.infer<typeof CodingAnalysisInputSchema>;

export const CodingAnalysisOutputSchema = z.object({
  analysisSummary: z.string().describe('A comprehensive summary and analysis of the coding problem performance.'),
});
export type CodingAnalysisOutput = z.infer<typeof CodingAnalysisOutputSchema>;
