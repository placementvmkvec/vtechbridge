
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Bot, User as UserIcon, Loader2, LogOut, BookUser, RotateCw, ArrowRight } from 'lucide-react';
import { conductInterview } from '@/ai/flows/interview-flow';
import type { InterviewState, InterviewResponse } from '@/ai/schemas/interview-schemas';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Markdown from 'react-markdown';
import Link from 'next/link';

type InterviewMessage = {
  role: 'user' | 'model';
  text: string;
};

const INTERVIEW_ROLES = [
  {
    title: 'Frontend Developer',
    description: 'Focuses on UI/UX, React, CSS, and browser performance.',
    icon: <BookUser className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Backend Developer',
    description: 'Covers APIs, databases, system design, and server-side logic.',
    icon: <BookUser className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Generalist',
    description: 'A mix of general software engineering questions.',
    icon: <BookUser className="h-8 w-8 text-primary" />,
  },
];

export default function InterviewPage() {
  const { toast } = useToast();
  
  const [interviewStage, setInterviewStage] = useState<'selecting_role' | 'in_progress' | 'finished'>('selecting_role');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [transcript, setTranscript] = useState<InterviewMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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
     // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
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

  const startInterview = async (role: string) => {
    setIsAIProcessing(true);
    try {
      const response: InterviewResponse = await conductInterview({ role, transcript: [] });
      setTranscript([{ role: 'model', text: response.modelResponse }]);
      speakText(response.modelResponse);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not start interview', description: error.message });
      setIsAIProcessing(false);
    }
  };

  useEffect(() => {
    if (interviewStage === 'in_progress' && selectedRole && transcript.length === 0) {
        startInterview(selectedRole);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStage, selectedRole]);
  
  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setInterviewStage('in_progress');
  }

  const handleUserResponse = async (audioAsDataUri: string, mimeType: string) => {
    setIsAIProcessing(true);
    const userMessage = { role: 'user' as const, text: '(Spoken response)' };
    const currentTranscriptWithUser = [...transcript, userMessage];
    setTranscript(currentTranscriptWithUser);
    
    try {
        const interviewState: InterviewState = {
            role: selectedRole!,
            transcript: transcript,
            userResponse: {
                url: audioAsDataUri,
                contentType: mimeType,
            },
        };

        const response: InterviewResponse = await conductInterview(interviewState);
        const modelMessage = { role: 'model' as const, text: response.modelResponse };
        setTranscript(prev => [...prev, modelMessage]);
        
        if (response.isInterviewOver) {
            setFinalFeedback(response.finalFeedback || "The interview is now complete. Thank you for your time!");
            setInterviewStage('finished');
        } else {
             speakText(response.modelResponse);
        }

    } catch (error: any) {
        console.error("Error with AI response:", error);
        toast({ variant: 'destructive', title: "AI Error", description: error.message || "The AI failed to respond." });
        setTranscript(transcript); // Revert to transcript without user message
        setIsAIProcessing(false);
    }
  }

  const handleEndInterview = async () => {
    if (!selectedRole) return;
    setIsAIProcessing(true);
    toast({ title: "Ending Interview...", description: "Generating your final feedback."});
    try {
         const interviewState: InterviewState = {
            role: selectedRole,
            transcript: transcript,
            endInterview: true,
        };
        const response: InterviewResponse = await conductInterview(interviewState);
        setFinalFeedback(response.finalFeedback || "The interview is now complete. Thank you for your time!");
        setInterviewStage('finished');
    } catch(error: any) {
        toast({ variant: 'destructive', title: "Error", description: "Could not generate final feedback."});
    } finally {
        setIsAIProcessing(false);
    }
  }
  
  const handleTryAgain = () => {
    setInterviewStage('selecting_role');
    setSelectedRole(null);
    setTranscript([]);
    setFinalFeedback(null);
    setIsSpeaking(false);
    setIsAIProcessing(false);
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = 'audio/webm';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleUserResponse(base64Audio, mimeType);
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

  if (interviewStage === 'selecting_role') {
    return (
      <main className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Select Your Interview Type</CardTitle>
            <CardDescription>Choose a role to tailor the questions for your mock interview.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INTERVIEW_ROLES.map(role => (
              <Card key={role.title} className="hover:shadow-lg hover:border-primary transition-all cursor-pointer" onClick={() => handleSelectRole(role.title)}>
                <CardHeader className="items-center">{role.icon}</CardHeader>
                <CardContent>
                  <h3 className="font-bold">{role.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (interviewStage === 'finished') {
    return (
       <main className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
          <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Interview Complete</CardTitle>
                <CardDescription>Here is the feedback on your performance for the {selectedRole} role.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none bg-secondary p-4 rounded-lg">
                <Markdown>{finalFeedback}</Markdown>
              </div>
            </CardContent>
            <CardFooter className="gap-4">
               <Button onClick={handleTryAgain}>
                    <RotateCw className="mr-2 h-4 w-4"/>
                    Try Another Role
               </Button>
               <Link href="/dashboard">
                <Button variant="outline">
                    <ArrowRight className="mr-2 h-4 w-4"/>
                    Back to Dashboard
                </Button>
               </Link>
            </CardFooter>
          </Card>
       </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1 flex items-center justify-center bg-secondary rounded-lg p-6">
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border-4 border-primary shadow-lg bg-black">
                <video 
                    src="/idle.mp4" 
                    autoPlay loop muted playsInline
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isSpeaking ? 'opacity-0' : 'opacity-100'}`}
                    data-ai-hint="idle avatar"
                />
                <video 
                    src="/talking.mp4" 
                    autoPlay loop muted playsInline
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}
                    data-ai-hint="talking avatar"
                />
                <p className="absolute top-2 left-2 text-white text-sm font-bold bg-black/50 px-2 py-1 rounded-md">AI Interviewer</p>
                
                <div className="absolute bottom-4 right-4 w-2/5 z-10">
                    <video ref={videoRef} className="w-full aspect-[4/3] rounded-md bg-background shadow-md object-cover" autoPlay muted playsInline />
                    {!hasCameraPermission && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-md">
                            <p className="text-white text-xs text-center p-1">Enable camera to see preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="md:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">AI Mock Interview</CardTitle>
                <CardDescription>Role: <span className="font-bold text-primary">{selectedRole}</span>. Press record to answer.</CardDescription>
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
                <Button onClick={toggleRecording} size="lg" disabled={isAIProcessing || transcript.length === 0}>
                {isRecording ? ( <> <Square className="mr-2 h-5 w-5" /> Stop Recording </> ) 
                             : ( <> <Mic className="mr-2 h-5 w-5" /> Record Answer </> )}
                </Button>
                {isRecording && <p className="text-sm text-muted-foreground animate-pulse">Recording... speak now.</p>}
                 <Button onClick={handleEndInterview} size="sm" variant="outline" disabled={isAIProcessing || transcript.length === 0}>
                     <LogOut className="mr-2 h-4 w-4"/>
                     End Interview & Get Feedback
                 </Button>
            </div>
            </CardContent>
        </div>
      </Card>
    </main>
  );
}
