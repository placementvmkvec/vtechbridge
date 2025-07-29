
"use client";

import { TestView } from "@/components/test-view";
import { AppHeader } from "@/components/app-header";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import type { Exam, Question } from "@/lib/mock-data";

type TestPageProps = {
  params: {
    id: string;
  };
};

export default function TestPage({ params }: TestPageProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getExamById = async (id: string) => {
      try {
        const examDocRef = doc(db, "exams", id);
        const examDoc = await getDoc(examDocRef);

        if (examDoc.exists()) {
          const examData = examDoc.data();
          const questionSets = examData.questionSets || {};
          const setKeys = Object.keys(questionSets);

          if (setKeys.length === 0) {
            setError("This exam has no question sets.");
            setLoading(false);
            return;
          }

          // Randomly select one question set for the user
          const randomSetKey = setKeys[Math.floor(Math.random() * setKeys.length)];
          const questions = questionSets[randomSetKey] || [];
          
          const loadedExam: Exam = {
            id: examDoc.id,
            title: examData.title,
            description: examData.description,
            duration: examData.duration,
            questionCount: questions.length,
            questions: questions.map((q: any) => ({...q})), // Ensure questions are plain objects
          };
          setExam(loadedExam);

        } else {
          setError("The requested exam could not be found.");
        }
      } catch (e: any) {
        console.error("Error fetching exam:", e);
        setError("An error occurred while fetching the exam.");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
        getExamById(params.id);
    }

  }, [params.id]);

  if (loading) {
     return (
       <div className="min-h-screen w-full flex flex-col bg-secondary">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl space-y-8">
                 <Skeleton className="h-10 w-1/4" />
                 <Skeleton className="h-8 w-full" />
                 <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                 </div>
                 <div className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                 </div>
            </div>
        </main>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-secondary">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exam not found</h1>
            <p className="text-muted-foreground">{error || "The requested exam could not be found."}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-secondary">
      <AppHeader />
      <TestView exam={exam} />
    </div>
  );
}
