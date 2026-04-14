
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interviewStartedRef = useRef(false);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);


  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
        toast({
            variant: 'destructive',
            title: 'TTS Not Supported',
            description: 'Your browser does not support text-to-speech.',
        });
        return;
    }
    window.speechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
        setIsSpeaking(true);
        setIsAIProcessing(true);
    };
    utterance.onend = () => {
        setIsSpeaking(false);
        setIsAIProcessing(false);
    };
    utterance.onerror = () => {
        setIsSpeaking(false);
        setIsAIProcessing(false);
        toast({ variant: 'destructive', title: 'Speech Error', description: 'Could not play the AI response.'});
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (interviewStartedRef.current) return;
    interviewStartedRef.current = true;

    const startInterview = async () => {
      setIsAIProcessing(true);
      try {
        const response: InterviewResponse = await conductInterview({ transcript: [] });
        setTranscript([{ role: 'model', text: response.modelResponse }]);
        speakText(response.modelResponse);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Could not start interview', description: error.message });
        setIsAIProcessing(false);
      }
    };
    startInterview();
     // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserResponse = async (audioAsDataUri: string) => {
    setIsAIProcessing(true);
    const userMessage = { role: 'user' as const, text: '(Spoken response)' };
    const currentTranscriptWithUser = [...transcript, userMessage];
    setTranscript(currentTranscriptWithUser);
    
    try {
        const interviewState: InterviewState = {
            transcript: currentTranscriptWithUser,
        };

        const response: InterviewResponse = await conductInterview(interviewState);
        const modelMessage = { role: 'model' as const, text: response.modelResponse };
        setTranscript(prev => [...prev, modelMessage]);
        speakText(response.modelResponse);
        
        if (response.isInterviewOver) {
            setIsInterviewOver(true);
            setFinalFeedback(response.feedback || "The interview is now complete. Thank you for your time!");
        }

    } catch (error: any) {
        console.error("Error with AI response:", error);
        toast({ variant: 'destructive', title: "AI Error", description: error.message || "The AI failed to respond." });
        setTranscript(transcript); // Revert to transcript without user message
        setIsAIProcessing(false);
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1 flex flex-col items-center justify-center bg-secondary rounded-lg p-6">
            <div className="relative w-full aspect-[3/4] max-w-sm rounded-lg overflow-hidden border-4 border-primary shadow-lg">
                <video 
                    src="/idle.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isSpeaking ? 'opacity-0' : 'opacity-100'}`}
                    data-ai-hint="idle avatar"
                />
                 <video 
                    src="/talking.mp4" 
                    autoPlay 
                    loop 
                    muted
                    playsInline
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}
                    data-ai-hint="talking avatar"
                />
            </div>
            <p className="text-muted-foreground mt-4 text-center">AI Interviewer</p>
            
            <div className="w-full max-w-sm mt-6">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-background" autoPlay muted playsInline />
                {!hasCameraPermission && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                        Please allow camera access to see your video preview.
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-muted-foreground mt-2 text-center">Your Preview</p>
            </div>
        </div>

        <div className="md:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">AI Mock Interview</CardTitle>
                <CardDescription>Practice your technical interview skills. Press record to answer.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col space-y-6">
            <div className="h-96 space-y-4 overflow-y-auto rounded-lg border p-4 bg-secondary flex-grow">
                {transcript.length === 0 && isAIProcessing && !isSpeaking && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-2 text-muted-foreground">Starting interview...</p>
                    </div>
                )}
                {transcript.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                    <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'model' ? 'bg-background' : 'bg-primary text-primary-foreground'}`}>
                    <p>{msg.text}</p>
                    </div>
                    {msg.role === 'user' && <UserIcon className="h-6 w-6 flex-shrink-0" />}
                </div>
                ))}
                {isAIProcessing && transcript.length > 0 && !isSpeaking && (
                    <div className="flex items-start gap-3">
                        <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="rounded-lg px-4 py-2 max-w-sm bg-background flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 pt-4">
                <Button onClick={toggleRecording} size="lg" disabled={isAIProcessing || isInterviewOver || transcript.length === 0}>
                {isRecording ? ( <> <Square className="mr-2 h-5 w-5" /> Stop Recording </> ) 
                             : ( <> <Mic className="mr-2 h-5 w-5" /> Record Answer </> )}
                </Button>
                {isRecording && <p className="text-sm text-muted-foreground animate-pulse">Recording... speak now.</p>}
            </div>

            {isInterviewOver && finalFeedback && (
                <Alert className="mt-4">
                    <AlertTitle className="font-bold">Interview Complete</AlertTitle>
                    <AlertDescription>
                        {finalFeedback}
                    </AlertDescription>
                </Alert>
            )}
            </CardContent>
        </div>
      </Card>
    </main>
  );
}
