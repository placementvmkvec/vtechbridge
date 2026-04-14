
'use server';

import { ai } from '@/ai/genkit';
import {
  InterviewStateSchema,
  InterviewResponseSchema,
  InterviewState,
  InterviewResponse,
} from '@/ai/schemas/interview-schemas';

const interviewPrompt = ai.definePrompt({
  name: 'interviewPrompt',
  input: { schema: InterviewStateSchema },
  output: { schema: InterviewResponseSchema },
  prompt: `You are an expert technical interviewer for a software engineering position. Your goal is to conduct a friendly but thorough interview based on a spoken conversation.

  - Start with a greeting and a simple "Tell me about yourself" question if the transcript is empty.
  - Ask a mix of behavioral and technical questions.
  - Ask one question at a time. Keep your responses concise.
  - Based on the user's spoken response, ask a relevant follow-up question or move to a new topic.
  - After 4-5 questions, decide to end the interview. Set 'isInterviewOver' to true.
  - When the interview is over, provide brief, constructive feedback on the user's answers.

  Current Transcript:
  {{#each transcript}}
  - {{role}}: {{text}}
  {{/each}}

  Analyze the user's latest spoken response and generate your next question or concluding feedback.
  {{#if userResponse}}
  User's latest response (audio): {{media url=userResponse.url contentType=userResponse.contentType}}
  {{/if}}
  `,
});

const interviewFlow = ai.defineFlow(
  {
    name: 'interviewFlow',
    inputSchema: InterviewStateSchema,
    outputSchema: InterviewResponseSchema,
  },
  async (state: InterviewState): Promise<InterviewResponse> => {
    const { output } = await interviewPrompt(state);
    if (!output) {
        throw new Error("Failed to generate a text response from the AI.");
    }
    return output;
  }
);

export async function conductInterview(state: InterviewState): Promise<InterviewResponse> {
  return interviewFlow(state);
}
