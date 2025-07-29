'use server';
/**
 * @fileOverview An exam analysis AI agent.
 *
 * - analyzeExam - A function that handles the exam analysis process.
 * - ExamAnalysisInput - The input type for the analyzeExam function.
 * - ExamAnalysisOutput - The return type for the analyzeExam function.
 */

import {ai} from '@/ai/genkit';
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


export async function analyzeExam(input: ExamAnalysisInput): Promise<ExamAnalysisOutput> {
  return analyzeExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeExamPrompt',
  input: {schema: ExamAnalysisInputSchema},
  output: {schema: ExamAnalysisOutputSchema},
  prompt: `
    You are an expert academic analyst. Your task is to provide a summary and analysis of an exam's performance based on the provided data. The exam title is "{{examTitle}}" and the pass percentage is {{passPercentage}}%.

    Here is the data for each question:
    {{#each questionAnalytics}}
    - Question: "{{this.questionText}}" | Correct: {{this.correct}} | Incorrect: {{this.incorrect}}
    {{/each}}

    Here is the performance data for each student:
    {{#each studentPerformances}}
    - Student: {{this.userName}} | Score: {{this.percentage}}%
    {{/each}}

    Based on this data, please provide a comprehensive analysis. Your analysis should include:
    1.  An overall summary of the performance. Calculate the average score and overall pass rate.
    2.  Identification of the top 3 most difficult questions (those with the highest number of incorrect answers).
    3.  Identification of the top 3 easiest questions (those with the highest number of correct answers).
    4.  Any notable patterns or insights you can derive from the data (e.g., are there specific topics students are struggling with? Is there a wide variation in performance?).
    5.  Actionable recommendations for instructors based on these insights.

    Format the output as a single block of text for the 'analysisSummary' field. Use markdown for formatting (e.g., headings, bold text, lists).
  `,
});

const analyzeExamFlow = ai.defineFlow(
  {
    name: 'analyzeExamFlow',
    inputSchema: ExamAnalysisInputSchema,
    outputSchema: ExamAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
