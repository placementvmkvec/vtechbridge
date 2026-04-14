
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  InterviewStateSchema,
  InterviewResponseSchema,
  InterviewState,
  InterviewResponse,
} from '@/ai/schemas/interview-schemas';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// A schema just for the text-generation part of the interview.
const InterviewTextResponseSchema = z.object({
  modelResponse: z.string().describe("The AI interviewer's response or next question."),
  isInterviewOver: z.boolean().describe('A flag to indicate if the interview has concluded.'),
  feedback: z.string().optional().describe('Final feedback for the user if the interview is over.'),
});


const interviewPrompt = ai.definePrompt({
  name: 'interviewPrompt',
  input: { schema: InterviewStateSchema },
  output: { schema: InterviewTextResponseSchema },
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
  User's latest response (audio): {{media url=userResponse}}
  `,
});

const interviewFlow = ai.defineFlow(
  {
    name: 'interviewFlow',
    inputSchema: InterviewStateSchema,
    outputSchema: InterviewResponseSchema,
  },
  async (state: InterviewState): Promise<InterviewResponse> => {
    // 1. Generate the text response from the interviewer AI
    const { output: textOutput } = await interviewPrompt(state);

    if (!textOutput?.modelResponse) {
        throw new Error("Failed to generate a text response from the AI.");
    }
    
    // 2. Convert the AI's text response to speech
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts', // FIX: Added the missing model property
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textOutput.modelResponse,
    });

    if (!media?.url) {
      throw new Error('Failed to generate audio from the text response.');
    }

    const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavData = await toWav(pcmData);

    // 3. Combine the text output with the generated audio URI
    return {
      ...textOutput,
      audioDataUri: 'data:audio/wav;base64,' + wavData,
    };
  }
);

export async function conductInterview(state: InterviewState): Promise<InterviewResponse> {
  return interviewFlow(state);
}
