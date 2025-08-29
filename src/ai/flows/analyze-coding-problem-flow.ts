
'use server';
/**
 * @fileOverview A coding problem analysis AI agent.
 *
 * - analyzeCodingProblem - A function that handles the coding problem analysis process.
 */

import {ai} from '@/ai/genkit';
import { CodingAnalysisInput, CodingAnalysisInputSchema, CodingAnalysisOutput, CodingAnalysisOutputSchema } from '@/ai/schemas/coding-analysis-schemas';

export async function analyzeCodingProblem(input: CodingAnalysisInput): Promise<CodingAnalysisOutput> {
  return analyzeCodingProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodingProblemPrompt',
  input: {schema: CodingAnalysisInputSchema},
  output: {schema: CodingAnalysisOutputSchema},
  prompt: `
    You are an expert programming instructor and code analyst. Your task is to provide a summary and analysis of student performance on a coding problem.
    
    The problem title is: "{{problemTitle}}"

    Here is the performance data for each test case:
    {{#each testCaseAnalytics}}
    - Test Case #{{this.index}} ({{this.type}}): Passed: {{this.passedCount}} | Failed: {{this.failedCount}}
    {{/each}}

    Here is the performance data for each student submission:
    {{#each studentPerformances}}
    - Student: {{this.userName}} | Score: {{this.score}}
    {{/each}}

    Based on this data, please provide a comprehensive analysis. Your analysis should include:
    1.  An overall summary of the performance. Calculate the average score and overall pass rate of submissions (consider a submission "passed" if it scores more than 0 points).
    2.  Identification of the top 3 most difficult test cases (those with the highest number of failures).
    3.  A brief analysis of WHY these test cases might be failing. Consider edge cases, data types, performance, etc.
    4.  Any notable patterns or insights (e.g., are many students failing the same private test cases? Does this point to a specific misunderstanding of the problem?).
    5.  Actionable recommendations for instructors to help students improve.

    Format the output as a single block of text for the 'analysisSummary' field. **Use markdown for formatting**. For example:
    ### Overall Summary
    - **Average Score**: 65
    - **Pass Rate**: 50%

    ### Most Difficult Test Cases
    1.  **Private Test Case #3**: 8 failures. This case likely tested for large inputs, causing timeouts or inefficient solutions to fail.
    2.  **Private Test Case #1**: 5 failures. This seems to be an edge case involving empty input arrays.
  `,
});

const analyzeCodingProblemFlow = ai.defineFlow(
  {
    name: 'analyzeCodingProblemFlow',
    inputSchema: CodingAnalysisInputSchema,
    outputSchema: CodingAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
