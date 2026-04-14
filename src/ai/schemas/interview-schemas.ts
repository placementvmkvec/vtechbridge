import { z } from 'zod';

export const InterviewMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const InterviewStateSchema = z.object({
  transcript: z.array(InterviewMessageSchema),
  userResponse: z.object({
    url: z.string()
      .describe(
        "The user's latest spoken response, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    contentType: z.string().describe("The MIME type of the audio, e.g., 'audio/webm'"),
  }).optional(),
});

export type InterviewState = z.infer<typeof InterviewStateSchema>;

export const InterviewResponseSchema = z.object({
  modelResponse: z.string().describe("The AI interviewer's response or next question."),
  isInterviewOver: z.boolean().describe('A flag to indicate if the interview has concluded.'),
  feedback: z.string().optional().describe('Final feedback for the user if the interview is over.'),
  audioDataUri: z.string().describe("The base64 encoded audio data URI of the model's response."),
});

export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;
