'use server';
/**
 * @fileOverview An AI flow for creating and processing exams from an uploaded file.
 *
 * - createExamFromQuestions - A function that handles parsing questions, splitting them into sets, and saving them as an exam.
 * - CreateExamInput - The input type for the createExamFromQuestions function.
 * - CreateExamOutput - The return type for the createExamFromQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as xlsx from 'xlsx';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the structure for a single question
const QuestionSchema = z.object({
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

// Exported wrapper function to be called from the frontend
export async function createExamFromQuestions(input: CreateExamInput): Promise<CreateExamOutput> {
  return createExamFlow(input);
}


// AI Prompt to structure and validate questions
const questionPrompt = ai.definePrompt({
  name: 'questionPrompt',
  input: { schema: z.object({ questions: z.array(z.any()) }) },
  output: { schema: z.object({ questions: z.array(QuestionSchema) }) },
  prompt: `You are an expert in structuring educational content. You will be given a list of questions extracted from a file.
  Your task is to format these questions into a clear, structured format. For each question, ensure you provide a unique ID, the question text, a list of options, and the correct answer.

  Here is the list of questions:
  {{{json questions}}}
  `,
});

// Genkit flow to orchestrate the exam creation process
const createExamFlow = ai.defineFlow(
  {
    name: 'createExamFlow',
    inputSchema: CreateExamInputSchema,
    outputSchema: CreateExamOutputSchema,
  },
  async (input) => {
    // 1. Parse the Excel file
    const workbook = xlsx.read(input.fileData, { type: 'base64' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawQuestions = xlsx.utils.sheet_to_json(worksheet);

    if (rawQuestions.length === 0) {
        throw new Error("No questions found in the provided file.");
    }
    
    // 2. Use AI to structure the questions
    const { output } = await questionPrompt({ questions: rawQuestions });
    if (!output || !output.questions) {
      throw new Error('AI failed to process the questions.');
    }
    let structuredQuestions = output.questions;

    // 3. Split questions into 5 sets
    const totalQuestions = structuredQuestions.length;
    const questionsPerSet = Math.ceil(totalQuestions / 5);
    const questionSets: Record<string, Question[]> = {};

    for (let i = 0; i < 5; i++) {
        const start = i * questionsPerSet;
        const end = start + questionsPerSet;
        questionSets[`set${i + 1}`] = structuredQuestions.slice(start, end);
    }

    // 4. Save the exam to Firestore
    const examsCollectionRef = collection(db, 'exams');
    const newExamRef = doc(examsCollectionRef);
    const examId = newExamRef.id;

    await setDoc(newExamRef, {
      id: examId,
      title: input.title,
      description: input.description,
      duration: input.duration,
      questionCount: totalQuestions,
      questionSets: questionSets,
      createdAt: new Date(),
    });

    return {
      examId: examId,
      message: `Successfully created exam with ${totalQuestions} questions split into 5 sets.`,
    };
  }
);
