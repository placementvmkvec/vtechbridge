"use client";

import type { Exam, Question } from "@/lib/mock-data";
import { useEffect, useState, useMemo } from "react";
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
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Answers = {
  [questionId: string]: string;
};

export function TestView({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion: Question = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questionCount) * 100;
  const isLastQuestion = currentQuestionIndex === exam.questionCount - 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
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

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    let score = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const timeTaken = (exam.duration * 60) - timeLeft;

    // Simulate API call
    setTimeout(() => {
        router.push(
          `/results/${exam.id}?score=${score}&total=${exam.questionCount}&time=${timeTaken}`
        );
    }, 1000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft < 60 ? 'text-destructive' : 'text-foreground';

  return (
    <div className="relative flex min-h-screen flex-col bg-muted/40">
       <AlertDialog open={isSubmitting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submitting your test...</AlertDialogTitle>
            <AlertDialogDescription>
                Please wait while we calculate your score. Good luck!
                <div className="flex justify-center items-center p-8">
                    <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
                </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <header className="sticky top-0 z-10 w-full border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-headline text-xl md:text-2xl font-bold truncate">{exam.title}</h1>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timerColor}`}>
            <Clock className="h-5 w-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="container mx-auto mt-2">
            <Progress value={progress} className="w-full" />
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Question {currentQuestionIndex + 1} of {exam.questionCount}
            </CardTitle>
            <CardDescription className="text-base md:text-lg pt-2 min-h-[60px]">
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
                <div key={index} className="flex items-center space-x-3 rounded-md border p-4 hover:bg-muted/50 has-[[data-state=checked]]:bg-secondary has-[[data-state=checked]]:border-primary transition-colors">
                  <RadioGroupItem value={option} id={`q${currentQuestion.id}-o${index}`} />
                  <Label htmlFor={`q${currentQuestion.id}-o${index}`} className="text-base font-normal flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {isLastQuestion ? (
              <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90">
                Submit Test <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
