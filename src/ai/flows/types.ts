/**
 * @fileOverview Type definitions for the exam creation flow.
 *
 * This file contains the Zod schemas and TypeScript types used for
 * creating exams, including the structure for questions, inputs, and outputs.
 */

import { z } from 'zod';

// Define the structure for a single question
export const QuestionSchema = z.object({
  id: z.string().describe('A unique identifier for the question.'),
  question: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('A list of possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options.'),
});
export type Question = z.infer<typeof QuestionSchema>;

// Define the input schema for creating an exam
export const CreateExamInputSchema = z.object({
  title: z.string().describe('The title of the exam.'),
  description: z.string().describe('A brief description of the exam.'),
  duration: z.number().describe('The duration of the exam in minutes.'),
  fileData: z.string().describe("The base64 encoded content of the Excel file containing the questions. The file should have columns: 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'."),
});
export type CreateExamInput = z.infer<typeof CreateExamInputSchema>;

// Define the output schema
export const CreateExamOutputSchema = z.object({
    examId: z.string(),
    message: z.string(),
});
export type CreateExamOutput = z.infer<typeof CreateExamOutputSchema>;
