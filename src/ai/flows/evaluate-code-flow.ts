
'use server';
/**
 * @fileOverview A coding evaluation AI agent.
 *
 * - evaluateCode - A function that handles the code evaluation process.
 */

import {ai} from '@/ai/genkit';
import { CodeEvaluationInput, CodeEvaluationInputSchema, CodeEvaluationOutput, CodeEvaluationOutputSchema } from '@/ai/schemas/code-evaluation-schemas';

export async function evaluateCode(input: CodeEvaluationInput): Promise<CodeEvaluationOutput> {
  return evaluateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateCodePrompt',
  input: {schema: CodeEvaluationInputSchema},
  output: {schema: CodeEvaluationOutputSchema},
  prompt: `
    You are an expert programmer and act as a strict code judge for an online testing platform.
    Your task is to evaluate a user's submitted code against a set of hidden test cases for a given problem.

    **Problem Statement:**
    {{problemStatement}}

    ---

    **User's Code (Language: {{language}}):**
    \`\`\`{{language}}
    {{userCode}}
    \`\`\`

    ---

    **Hidden Test Cases:**
    You must evaluate the code against the following test cases. A test case is passed only if the output is an exact match.
    {{#each testCases}}
    - Test Case {{this.id}}:
      - Input: "{{this.input}}"
      - Expected Output: "{{this.output}}"
    {{/each}}

    ---

    **Evaluation Steps:**
    1.  Carefully analyze the user's code for correctness, logic, and syntax.
    2.  For each test case, mentally execute the code with the given input.
    3.  Compare the actual output of the code with the expected output for that test case. The match must be exact.
    4.  Count the total number of test cases that passed successfully.
    5.  Provide brief, constructive feedback for the user. If any test cases failed, explain why (e.g., "Failed on edge case with negative numbers," or "Incorrect output format"). If all passed, give positive feedback.

    **Output Format:**
    You must return a JSON object that conforms to the specified output schema.
  `,
});

const evaluateCodeFlow = ai.defineFlow(
  {
    name: 'evaluateCodeFlow',
    inputSchema: CodeEvaluationInputSchema,
    outputSchema: CodeEvaluationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
