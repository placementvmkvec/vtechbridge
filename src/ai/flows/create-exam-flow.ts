'use server';
/**
 * @fileOverview An AI flow for creating and processing exams from an uploaded file.
 *
 * - createExamFromQuestions - A function that handles parsing questions, splitting them into sets, and saving them as an exam.
 */

import {ai} from '@/ai/genkit';
import * as xlsx from 'xlsx';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
    QuestionSchema, 
    CreateExamInputSchema,
    CreateExamOutputSchema,
    type CreateExamInput,
    type CreateExamOutput,
    type Question
} from '@/ai/flows/types';
import { z } from 'zod';


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
        if (start >= totalQuestions) break;
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
