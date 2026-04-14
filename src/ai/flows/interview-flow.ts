
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
  prompt: `You are an expert technical interviewer for a {{role}} software engineering position. Your goal is to conduct a friendly but thorough interview.

  - Start with a greeting and a simple "Tell me about yourself" question if the transcript is empty.
  - Ask a mix of behavioral and technical questions relevant to the {{role}} position.
  - Ask one question at a time. Keep your responses concise.
  - Based on the user's spoken response, ask a relevant follow-up question or move to a new topic.
  - The interview should last for about 4-5 user responses. After that, or if 'endInterview' is true, you MUST end the interview.
  - To end the interview, set 'isInterviewOver' to true and generate the final feedback.
  - When the interview is over, provide comprehensive, constructive feedback based on the ENTIRE transcript. The feedback should be in markdown and include:
    - **Overall Summary:** A brief overview of the interview.
    - **Strengths:** 2-3 specific points where the candidate did well.
    - **Areas for Improvement:** 2-3 specific, actionable suggestions for what the candidate could do better.
    - **Final Recommendation:** A concluding thought on the candidate's performance.

  Current Transcript:
  {{#each transcript}}
  - {{role}}: {{text}}
  {{/each}}

  Analyze the user's latest spoken response and generate your next question OR your concluding feedback if the interview is over.
  {{#if userResponse}}
  User's latest response (audio): {{media url=userResponse.url contentType=userResponse.contentType}}
  {{/if}}

  {{#if endInterview}}
  The user has requested to end the interview. Conclude it now and provide final feedback.
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
