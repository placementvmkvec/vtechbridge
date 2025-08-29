
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, where, query, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CodingTestView } from '@/components/coding-test-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';


export type TestCase = {
  input: string;
  output: string;
}

export type CodingProblem = {
  id: string;
  title: string;
  language: string;
  problemStatement: string;
  publicTestCases: TestCase[];
  privateTestCases: TestCase[];
  pointsPerCase: number;
  createdAt: Timestamp;
};

type CodingExam = {
  id: string;
  title: string;
  problemIds: string[];
};

type SubmissionPayload = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  examId: string;
  examTitle: string;
  scores: Record<string, number>; // problemId -> score
  totalScore: number;
  results: Record<string, any[]>; // problemId -> evaluation results
  createdAt: Date;
}


export default function CodingExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const examId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [exam, setExam] = useState<CodingExam | null>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalSubmissions, setFinalSubmissions] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!examId) return;

    const fetchExamAndProblems = async () => {
      setLoading(true);
      try {
        const examDocRef = doc(db, 'coding_exams', examId);
        const examDoc = await getDoc(examDocRef);
        if (!examDoc.exists()) {
          setError('Exam not found.');
          return;
        }
        const examData = { id: examDoc.id, ...examDoc.data() } as CodingExam;
        setExam(examData);

        if (examData.problemIds && examData.problemIds.length > 0) {
           const problemsQuery = query(collection(db, 'coding_problems'), where('__name__', 'in', examData.problemIds));
           const problemsSnapshot = await getDocs(problemsQuery);
           const fetchedProblems = problemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodingProblem));
           
           // Ensure order is the same as in problemIds
           const orderedProblems = examData.problemIds.map(id => fetchedProblems.find(p => p.id === id)).filter(p => p) as CodingProblem[];
           setProblems(orderedProblems);
        }

      } catch (err) {
        console.error('Error fetching coding exam:', err);
        setError('Failed to load the coding exam.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndProblems();
  }, [examId]);
  
  const handleIndividualSubmit = (problemId: string, submissionData: any) => {
      setFinalSubmissions(prev => ({
          ...prev,
          [problemId]: submissionData
      }));
      toast({ title: `Problem "${submissionData.problemTitle}" Saved`, description: "Your progress for this problem has been saved. Submit the entire exam when you're finished."})
  }
  
  const handleFinalSubmit = async () => {
    if (!user || !exam) return;

    const submittedProblemIds = Object.keys(finalSubmissions);
    if (submittedProblemIds.length !== problems.length) {
        toast({ variant: 'destructive', title: "Incomplete Exam", description: `Please run and save a submission for all ${problems.length} problems before submitting the exam.`});
        return;
    }

    setIsSubmitting(true);
    
    let totalScore = 0;
    const scores: Record<string, number> = {};
    const results: Record<string, any[]> = {};
    
    for(const problemId in finalSubmissions) {
        const sub = finalSubmissions[problemId];
        scores[problemId] = sub.score;
        results[problemId] = sub.results;
        totalScore += sub.score;
    }

    const payload: SubmissionPayload = {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        examId: exam.id,
        examTitle: exam.title,
        scores,
        totalScore,
        results,
        createdAt: new Date(),
    };

    try {
        await addDoc(collection(db, 'coding_exam_submissions'), payload);
        toast({ title: 'Exam Submitted!', description: `Your final score is ${totalScore}. Redirecting to dashboard...` });
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    } catch(err: any) {
        console.error("Error submitting final exam:", err);
        toast({ variant: 'destructive', title: "Submission Failed", description: err.message });
        setIsSubmitting(false);
    }
  }


  if (loading) {
    return (
      <div className="flex-1 bg-secondary p-4 lg:p-8">
         <Skeleton className="h-12 w-full mb-4" />
         <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-secondary p-4">
       <AlertDialog open={isSubmitting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submitting Exam...</AlertDialogTitle>
            <AlertDialogDescription>
                Please wait while we process your final submission. Good luck!
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
        <div className="flex justify-between items-center mb-4 bg-background p-3 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold font-headline">{exam?.title}</h1>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                <Shield className="mr-2 h-4 w-4"/>
                Submit Final Exam
            </Button>
        </div>
      <Tabs defaultValue={problems[0]?.id} className="w-full">
        <TabsList>
          {problems.map(p => (
            <TabsTrigger key={p.id} value={p.id}>{p.title}</TabsTrigger>
          ))}
        </TabsList>
        {problems.map(p => (
          <TabsContent key={p.id} value={p.id}>
             <CodingTestView problem={p} isExamMode={true} onExamSubmit={handleIndividualSubmit} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
