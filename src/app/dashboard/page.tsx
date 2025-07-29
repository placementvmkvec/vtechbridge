
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Clock, FileText, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type Exam = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number;
};

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsCollectionRef = collection(db, 'exams');
        const querySnapshot = await getDocs(examsCollectionRef);
        const fetchedExams = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Exam[];
        setExams(fetchedExams);
      } catch (error) {
        console.error("Error fetching exams: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-secondary">
      <AppHeader />
      <main className="flex-1 container mx-auto p-4 md:p-8">
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
            exams.map((exam) => (
              <div key={exam.id} className="flip-card h-[280px]">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                     <Card className="flex flex-col h-full shadow-lg border-transparent hover:border-primary transition-colors">
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
                          <div className="text-sm text-primary font-semibold">Hover to see details & start</div>
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
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105">
                              Start Test <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                  </div>
                </div>
              </div>
            ))
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
