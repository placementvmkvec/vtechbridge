
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Code, Trash2, Edit, PlusCircle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type TestCase = {
  input: string;
  output: string;
};

type CodingProblem = {
  id: string;
  title: string;
  language: string;
  publicTestCases: TestCase[];
  privateTestCases: TestCase[];
  pointsPerCase: number;
  createdAt: Timestamp;
};

export default function AdminCodingProblemsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemToDelete, setProblemToDelete] =
    useState<CodingProblem | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setAdminUser(currentUser);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (adminUser) {
      fetchProblems();
    }
  }, [adminUser]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const problemsQuery = query(
        collection(db, 'coding_problems'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(problemsQuery);
      const fetchedProblems = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as CodingProblem)
      );
      setProblems(fetchedProblems);
    } catch (error) {
      console.error('Error fetching coding problems:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch coding problems.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!problemToDelete) return;

    try {
      await deleteDoc(doc(db, 'coding_problems', problemToDelete.id));
      toast({
        title: 'Success',
        description: `Problem "${problemToDelete.title}" has been deleted.`,
      });
      fetchProblems(); // Refresh the list
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the problem.',
      });
    } finally {
      setProblemToDelete(null);
    }
  };

  if (!adminUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Coding Problems</h1>
          <p className="text-muted-foreground">
            View, create, and manage all individual coding problems.
          </p>
        </div>
        <Link href="/admin/coding/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Problem
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Problems</CardTitle>
          <CardDescription>
            A list of all available coding challenges. These can be bundled into a Coding Exam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem Title</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Public Cases</TableHead>
                <TableHead>Private Cases</TableHead>
                <TableHead>Points/Case</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : problems.length > 0 ? (
                problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell className="font-medium">
                      {problem.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{problem.language}</Badge>
                    </TableCell>
                    <TableCell>
                      {problem.publicTestCases?.length || 0}
                    </TableCell>
                    <TableCell>
                      {problem.privateTestCases?.length || 0}
                    </TableCell>
                    <TableCell>{problem.pointsPerCase || 0}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {problem.createdAt
                        ? formatDistanceToNow(problem.createdAt.toDate(), {
                            addSuffix: true,
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Link href={`/admin/coding/${problem.id}/analytics`}>
                         <Button variant="outline" size="icon">
                            <BarChart2 className="h-4 w-4" />
                            <span className="sr-only">View Analytics</span>
                         </Button>
                       </Link>
                       <Link href={`/admin/coding/${problem.id}/edit`}>
                         <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                         </Button>
                       </Link>
                      <AlertDialog
                        open={
                          !!problemToDelete && problemToDelete.id === problem.id
                        }
                        onOpenChange={(open) => !open && setProblemToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setProblemToDelete(problem)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the coding problem{' '}
                              <span className="font-bold">
                                "{problemToDelete?.title}"
                              </span>
                              .
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteProblem}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No coding problems have been created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
