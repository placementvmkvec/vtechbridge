
'use server';
/**
 * @fileOverview An exam analysis AI agent.
 *
 * - analyzeExam - A function that handles the exam analysis process.
 */

import {ai} from '@/ai/genkit';
import { ExamAnalysisInput, ExamAnalysisInputSchema, ExamAnalysisOutput, ExamAnalysisOutputSchema } from '@/ai/schemas/exam-analysis-schemas';

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

    Format the output as a single block of text for the 'analysisSummary' field. **Use markdown for formatting**. For example:
    ### Overall Summary
    - **Average Score**: 75%
    - **Pass Rate**: 100%

    ### Most Difficult Questions
    1.  **Question A**: 5 incorrect answers.
    2.  **Question B**: 4 incorrect answers.
    3.  **Question C**: 3 incorrect answers.
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

    