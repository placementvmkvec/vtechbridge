
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { conductInterview } from '@/ai/flows/interview-flow';
import type { InterviewState, InterviewResponse } from '@/ai/schemas/interview-schemas';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type InterviewMessage = {
  role: 'user' | 'model';
  text: string;
};

export default function InterviewPage() {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<InterviewMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isInterviewOver, setIsInterviewOver] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Start the interview when the component mounts
  useEffect(() => {
    const startInterview = async () => {
      setIsAIProcessing(true);
      try {
        const response: InterviewResponse = await conductInterview({ transcript: [] });
        setTranscript([{ role: 'model', text: response.modelResponse }]);
        if (response.audioDataUri && audioRef.current) {
          audioRef.current.src = response.audioDataUri;
          audioRef.current.play();
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Could not start interview', description: error.message });
      } finally {
        setIsAIProcessing(false);
      }
    };
    startInterview();
  }, [toast]);

  const handleUserResponse = async (audioAsDataUri: string) => {
    setIsAIProcessing(true);
    const newTranscript = [...transcript, { role: 'user' as const, text: '(Spoken response)' }];
    setTranscript(newTranscript);
    
    try {
        const interviewState: InterviewState = {
            transcript: newTranscript,
            userResponse: audioAsDataUri,
        };

        const response: InterviewResponse = await conductInterview(interviewState);

        setTranscript((prev) => [...prev, { role: 'model', text: response.modelResponse }]);

        if (response.audioDataUri && audioRef.current) {
            audioRef.current.src = response.audioDataUri;
            audioRef.current.play();
        }
        
        if (response.isInterviewOver) {
            setIsInterviewOver(true);
            setFinalFeedback(response.feedback || "The interview is now complete. Thank you for your time!");
        }

    } catch (error: any) {
        console.error("Error with AI response:", error);
        toast({
            variant: 'destructive',
            title: "AI Error",
            description: error.message || "The AI failed to respond."
        });
        // Remove the 'spoken response' placeholder on error
        setTranscript(transcript);
    } finally {
        setIsAIProcessing(false);
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleUserResponse(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
          variant: 'destructive',
          title: "Microphone Access Denied",
          description: "Please allow microphone access in your browser settings to proceed."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">AI Mock Interview</CardTitle>
          <CardDescription>Practice your technical interview skills with our AI interviewer. Press record to answer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-96 space-y-4 overflow-y-auto rounded-lg border p-4 bg-secondary">
            {transcript.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'model' ? 'bg-background' : 'bg-primary text-primary-foreground'}`}>
                  <p>{msg.text}</p>
                </div>
                {msg.role === 'user' && <UserIcon className="h-6 w-6 flex-shrink-0" />}
              </div>
            ))}
             {isAIProcessing && transcript.length > 0 && (
                 <div className="flex items-start gap-3">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                     <div className="rounded-lg px-4 py-2 max-w-sm bg-background flex items-center">
                       <Loader2 className="h-5 w-5 animate-spin"/>
                    </div>
                </div>
            )}
             {transcript.length === 0 && isAIProcessing && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
             <Button onClick={toggleRecording} size="lg" disabled={isAIProcessing || isInterviewOver || transcript.length === 0}>
              {isRecording ? (
                <>
                  <Square className="mr-2 h-5 w-5" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" /> Record Answer
                </>
              )}
            </Button>
            {isRecording && <p className="text-sm text-muted-foreground animate-pulse">Recording... speak now.</p>}
          </div>

          {isInterviewOver && finalFeedback && (
              <Alert>
                  <AlertTitle className="font-bold">Interview Complete</AlertTitle>
                  <AlertDescription>
                      {finalFeedback}
                  </AlertDescription>
              </Alert>
          )}

          <audio ref={audioRef} className="hidden" onPlay={() => setIsAIProcessing(true)} onEnded={() => setIsAIProcessing(false)}/>
        </CardContent>
      </Card>
    </main>
  );
}
