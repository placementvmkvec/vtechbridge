
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CodingTestView } from '@/components/coding-test-view';
import { Skeleton } from '@/components/ui/skeleton';


export type CodingProblem = {
  id: string;
  title: string;
  language: string;
  problemStatement: string;
  testCases: { input: string; output: string }[];
  createdAt: Timestamp;
};

export default function CodingProblemPage() {
  const params = useParams();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!problemId) return;

    const fetchProblem = async () => {
      setLoading(true);
      try {
        const problemDocRef = doc(db, 'coding_problems', problemId);
        const problemDoc = await getDoc(problemDocRef);
        if (problemDoc.exists()) {
          setProblem({ id: problemDoc.id, ...problemDoc.data() } as CodingProblem);
        } else {
          setError('Problem not found.');
        }
      } catch (err) {
        console.error('Error fetching coding problem:', err);
        setError('Failed to load the coding problem.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  if (loading) {
    return (
      <div className="flex-1 bg-secondary p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
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

  if (!problem) {
     return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Could not find the requested problem.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-secondary">
      <CodingTestView problem={problem} />
    </div>
  );
}
