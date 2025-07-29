
import { TestView } from "@/components/test-view";
import { AppHeader } from "@/components/app-header";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Exam } from "@/lib/mock-data";

type TestPageProps = {
  params: {
    id: string;
  };
};

async function getExamById(id: string): Promise<Exam | null> {
    try {
        const examDocRef = doc(db, "exams", id);
        const examDoc = await getDoc(examDocRef);

        if (examDoc.exists()) {
            const examData = examDoc.data();
            const questionSets = examData.questionSets || {};
            const setKeys = Object.keys(questionSets);

            if (setKeys.length === 0) {
                console.error("This exam has no question sets.");
                return null;
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
            return loadedExam;
        } else {
            console.error("The requested exam could not be found.");
            return null;
        }
    } catch (e: any) {
        console.error("Error fetching exam:", e);
        return null;
    }
}


export default async function TestPage({ params }: TestPageProps) {
  const exam = await getExamById(params.id);

  if (!exam) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-secondary">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exam not found</h1>
            <p className="text-muted-foreground">The requested exam could not be found or has no questions.</p>
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
