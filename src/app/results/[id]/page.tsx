import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { CheckCircle, XCircle, Clock, Award, Home } from "lucide-react";
import { notFound } from "next/navigation";

type ResultsPageProps = {
  params: { id: string };
  searchParams: {
    score?: string;
    total?: string;
    time?: string;
  };
};

export default function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const exam = MOCK_EXAMS.find((e) => e.id === params.id);
  
  if (!exam) {
    notFound();
  }

  const score = Number(searchParams.score || 0);
  const total = Number(searchParams.total || exam.questionCount);
  const timeTaken = Number(searchParams.time || 0);

  const percentage = total > 0 ? (score / total) * 100 : 0;
  const incorrect = total - score;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Excellent work!", icon: <Award className="h-16 w-16 text-yellow-400" />, color: "text-primary" };
    if (percentage >= 70) return { message: "Great job!", icon: <Award className="h-16 w-16 text-slate-500" />, color: "text-primary" };
    if (percentage >= 50) return { message: "Good effort!", icon: <CheckCircle className="h-16 w-16 text-primary" />, color: "text-yellow-600" };
    return { message: "Keep practicing!", icon: <XCircle className="h-16 w-16 text-destructive" />, color: "text-destructive" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen w-full flex flex-col bg-secondary">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl text-center">
          <CardHeader>
            <div className="mx-auto my-4">{performance.icon}</div>
            <CardTitle className="font-headline text-4xl">{performance.message}</CardTitle>
            <CardDescription className="text-base">You have completed the "{exam.title}" exam.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Your Score</p>
              <p className={`font-bold text-6xl ${performance.color}`}>{Math.round(percentage)}%</p>
            </div>
            <Progress value={percentage} className="h-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center pt-4">
              <div className="p-4 bg-secondary rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{score}</p>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold">{incorrect}</p>
                <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</p>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
