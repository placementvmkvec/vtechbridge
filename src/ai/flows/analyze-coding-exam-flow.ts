
'use server';
/**
 * @fileOverview A coding exam analysis AI agent.
 *
 * - analyzeCodingExam - A function that handles the coding exam analysis process.
 */

import {ai} from '@/ai/genkit';
import { CodingExamAnalysisInput, CodingExamAnalysisInputSchema, CodingExamAnalysisOutput, CodingExamAnalysisOutputSchema } from '@/ai/schemas/coding-exam-analysis-schemas';

export async function analyzeCodingExam(input: CodingExamAnalysisInput): Promise<CodingExamAnalysisOutput> {
  return analyzeCodingExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodingExamPrompt',
  input: {schema: CodingExamAnalysisInputSchema},
  output: {schema: CodingExamAnalysisOutputSchema},
  prompt: `
    You are an expert programming instructor and academic analyst. Your task is to provide a summary and analysis of student performance on a coding exam.
    
    The exam title is: "{{examTitle}}"

    Here is the performance data for each problem in the exam:
    {{#each problemAnalytics}}
    - Problem: "{{this.title}}" | Average Score: {{this.averageScore}} | Submissions: {{this.submissionCount}}
    {{/each}}

    Here is the overall performance data for each student:
    {{#each studentPerformances}}
    - Student: {{this.userName}} | Total Score: {{this.totalScore}}
    {{/each}}

    Based on this data, please provide a comprehensive analysis. Your analysis should include:
    1.  An overall summary of student performance across the entire exam.
    2.  Identification of the top 3 most difficult problems (those with the lowest average scores).
    3.  Identification of the top 3 easiest problems (those with the highest average scores).
    4.  A brief analysis of WHY certain problems might be difficult (e.g., complexity, specific algorithms required).
    5.  Any notable patterns (e.g., are students who do well on one problem also doing well on another related problem?).
    6.  Actionable recommendations for instructors to help students improve.

    Format the output as a single block of text for the 'analysisSummary' field. **Use markdown for formatting**. For example:
    ### Overall Summary
    - The overall performance was moderate, with students finding certain data structures more challenging than others.

    ### Most Difficult Problems
    1.  **Problem C**: Avg Score: 25. This problem likely required dynamic programming, which seems to be a weak area.
    2.  **Problem A**: Avg Score: 45. This problem involved complex edge cases with linked lists.
  `,
});

const analyzeCodingExamFlow = ai.defineFlow(
  {
    name: 'analyzeCodingExamFlow',
    inputSchema: CodingExamAnalysisInputSchema,
    outputSchema: CodingExamAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
