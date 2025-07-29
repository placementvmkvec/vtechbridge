
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type Submission = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submittedAt: Timestamp;
};

type Exam = {
  id: string;
  title: string;
  passPercentage: number;
};

export default function ExamSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (adminUser && examId) {
      fetchExamAndSubmissions();
    }
  }, [adminUser, examId]);

  const fetchExamAndSubmissions = async () => {
    setLoading(true);
    try {
      // Fetch Exam Details
      const examDocRef = doc(db, 'exams', examId);
      const examDoc = await getDoc(examDocRef);
      if (examDoc.exists()) {
        setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Exam not found.',
        });
      }

      // Fetch Submissions
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('examId', '==', examId),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(submissionsQuery);
      const fetchedSubmissions = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Submission)
      );
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch exam data and submissions.',
      });
    } finally {
      setLoading(false);
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
      <div className="mb-4">
        <Link href="/admin/exams">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Exams
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Submissions for "{exam?.title || 'Loading...'}"</CardTitle>
          <CardDescription>
            A list of all user submissions for this specific exam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : submissions.length > 0 ? (
                submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border">
                           <AvatarImage src={`https://placehold.co/100x100.png`} alt={sub.userName || ''} data-ai-hint="user avatar" />
                          <AvatarFallback>
                            {sub.userName?.charAt(0) ?? 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{sub.userName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {sub.userEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.percentage >= (exam?.passPercentage ?? 50)
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {sub.percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {sub.submittedAt
                        ? formatDistanceToNow(sub.submittedAt.toDate(), {
                            addSuffix: true,
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/submissions/${sub.id}`}>
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No submissions found for this exam yet.
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
