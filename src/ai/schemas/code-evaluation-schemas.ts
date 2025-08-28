
import {z} from 'genkit';

const TestCaseSchema = z.object({
    id: z.number().describe("The unique identifier for the test case."),
    input: z.string().describe("The input for the test case."),
    output: z.string().describe("The expected output for the test case."),
});

export const CodeEvaluationInputSchema = z.object({
  problemStatement: z.string().describe("The full description of the coding problem."),
  userCode: z.string().describe("The code submitted by the user."),
  language: z.string().describe("The programming language of the user's code (e.g., 'python', 'javascript')."),
  testCases: z.array(TestCaseSchema).describe("An array of hidden test cases to evaluate the code against."),
});
export type CodeEvaluationInput = z.infer<typeof CodeEvaluationInputSchema>;

export const CodeEvaluationOutputSchema = z.object({
    testCasesPassed: z.number().describe("The total number of hidden test cases that the user's code passed."),
    totalTestCases: z.number().describe("The total number of hidden test cases."),
    feedback: z.string().describe("Concise, constructive feedback for the user about their submission."),
});
export type CodeEvaluationOutput = z.infer<typeof CodeEvaluationOutputSchema>;
