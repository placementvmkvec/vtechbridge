
"use client";

import type { Exam, Question } from "@/lib/mock-data";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";


type Answers = {
  [questionId: string]: string;
};

export function TestView({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const currentQuestion: Question | undefined = exam.questions[currentQuestionIndex];
  const progress = exam.questionCount > 0 ? ((currentQuestionIndex + 1) / exam.questionCount) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === exam.questionCount - 1;

  const stopTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit(true); // Auto-submit
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (autoSubmitted = false) => {
    if (isSubmitting || !user) return;
    
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    stopTimer();
    
    let score = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const timeTaken = (exam.duration * 60) - timeLeft;
    const percentage = exam.questionCount > 0 ? (score / exam.questionCount) * 100 : 0;
    
    try {
        const submissionId = `${user.uid}_${exam.id}`;
        const submissionRef = doc(db, "submissions", submissionId);
        
        await setDoc(submissionRef, {
            examId: exam.id,
            examTitle: exam.title,
            userId: user.uid,
            userName: user.displayName,
            userEmail: user.email,
            score,
            totalQuestions: exam.questionCount,
            percentage: Math.round(percentage),
            timeTaken,
            submittedAt: serverTimestamp(),
            answers: answers, // Save the full answers object
        });
    } catch(error) {
        console.error("Failed to save submission:", error);
    }

    setTimeout(() => {
        router.push(
          `/results/${exam.id}?score=${score}&total=${exam.questionCount}&time=${timeTaken}&title=${encodeURIComponent(exam.title)}`
        );
    }, 1500);
  };
  
  if (!currentQuestion) {
      return (
         <div className="flex-1 flex items-center justify-center">
            <p>No questions available for this exam.</p>
         </div>
      )
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft < 60 ? 'text-destructive' : 'text-foreground';

  return (
    <div className="relative flex flex-1 flex-col">
       <AlertDialog open={isSubmitting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submitting your test...</AlertDialogTitle>
            <div className="flex justify-center items-center p-8">
                <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
            </div>
            <AlertDialogDescription>
                Please wait while we calculate your score. Good luck!
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              Once you submit, you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit()}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="container mx-auto flex items-center justify-between p-4 border-b">
          <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-primary">Progress</span>
                <span className="text-sm font-medium text-primary">{currentQuestionIndex + 1} / {exam.questionCount}</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timerColor} ml-8`}>
            <Clock className="h-5 w-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>
        </div>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-xl border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <CardDescription className="text-lg md:text-xl pt-4 min-h-[60px] text-foreground">
              {currentQuestion.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-secondary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value={option} id={`q${currentQuestion.id}-o${index}`} />
                  <Label htmlFor={`q${currentQuestion.id}-o${index}`} className="text-base font-normal flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {isLastQuestion ? (
              <Button onClick={() => setShowSubmitConfirm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Submit Test <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
