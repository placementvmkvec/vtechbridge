
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileText, ArrowRight, CheckCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, User } from "firebase/auth";

type Exam = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [completedExams, setCompletedExams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchExams(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchExams = async (userId: string) => {
    try {
      // Fetch all exams
      const examsCollectionRef = collection(db, 'exams');
      const examsSnapshot = await getDocs(examsCollectionRef);
      const fetchedExams = examsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exam[];
      setExams(fetchedExams);

      // Fetch user's submissions to check for completed exams
      const submissionsQuery = query(collection(db, "submissions"), where("userId", "==", userId));
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const completed = new Set(submissionsSnapshot.docs.map(doc => doc.data().examId));
      setCompletedExams(completed);

    } catch (error) {
      console.error("Error fetching exams: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-secondary">
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground mt-2">Here are your available exams. Good luck!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="h-[280px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                           <Skeleton className="h-4 w-4" />
                           <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4" />
                           <Skeleton className="h-4 w-20" />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
             ))
          ) : exams.length > 0 ? (
            exams.map((exam) => {
              const isCompleted = completedExams.has(exam.id);
              return (
                <div key={exam.id} className={`flip-card h-[280px] ${isCompleted ? 'opacity-70 pointer-events-none' : ''}`}>
                  <div className="flip-card-inner">
                    <div className="flip-card-front">
                      <Card className="flex flex-col h-full shadow-lg border-transparent hover:border-primary transition-colors relative">
                        {isCompleted && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                                <CheckCircle className="h-4 w-4" />
                                <span>Completed</span>
                            </div>
                        )}
                        <CardHeader>
                          <CardTitle className="font-headline text-xl">{exam.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{exam.questionCount} Questions</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>{exam.duration} Minutes</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                            <div className="text-sm text-primary font-semibold">
                                {isCompleted ? "You have already taken this test" : "Hover to see details & start"}
                            </div>
                        </CardFooter>
                      </Card>
                    </div>
                    <div className="flip-card-back">
                      <Card className="flex flex-col h-full bg-card shadow-lg border-primary">
                          <CardHeader>
                            <CardTitle className="font-headline text-xl">{exam.title}</CardTitle>
                            <CardDescription>{exam.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow" />
                          <CardFooter>
                            <Link href={`/test/${exam.id}`} className="w-full">
                              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105" disabled={isCompleted}>
                                {isCompleted ? 'Test Completed' : <>Start Test <ArrowRight className="ml-2 h-4 w-4" /></>}
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-card rounded-lg">
              <h2 className="text-xl font-semibold">No Exams Available</h2>
              <p className="text-muted-foreground mt-2">Please check back later. Your administrator has not assigned any exams yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
