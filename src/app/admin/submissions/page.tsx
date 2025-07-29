
'use client';

import { useEffect, useState, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

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
    passPercentage: number;
}

function SubmissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [examIdFilter, setExamIdFilter] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [examsMap, setExamsMap] = useState<Record<string, Exam>>({});

  useEffect(() => {
    const examId = searchParams.get('examId');
    setExamIdFilter(examId);
  }, [searchParams]);

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
        fetchSubmissions();
    }
  }, [adminUser, examIdFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let submissionsQuery;
      if (examIdFilter) {
        submissionsQuery = query(collection(db, 'submissions'), where('examId', '==', examIdFilter), orderBy('submittedAt', 'desc'));
        const examDoc = await getDoc(doc(db, 'exams', examIdFilter));
        if (examDoc.exists()) {
            setExamTitle(examDoc.data().title);
        }
      } else {
        submissionsQuery = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(submissionsQuery);
      const fetchedSubmissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];

      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsDataMap = examsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data() as Exam;
        return acc;
      }, {} as Record<string, Exam>);
      setExamsMap(examsDataMap);
      
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
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

  const pageTitle = examIdFilter ? `Submissions for "${examTitle || 'Exam'}"` : "All Submissions";
  const pageDescription = examIdFilter ? `A list of all submissions for this specific exam.` : `A list of all submissions across all exams.`;

  return (
    <div className="container mx-auto py-8">
        {examIdFilter && (
             <div className="mb-4">
                <Link href="/admin/dashboard">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        )}
        <Card>
        <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Exam</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className='space-y-2'>
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                        </TableRow>
                    ))
                ) : submissions.length > 0 ? (
                    submissions.map((sub) => {
                        const exam = examsMap[sub.examId];
                        const passPercentage = exam?.passPercentage ?? 50;
                        return (
                            <TableRow key={sub.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={`https://placehold.co/100x100.png`} alt={sub.userName || ''} data-ai-hint="user avatar" />
                                            <AvatarFallback>{sub.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{sub.userName || 'N/A'}</div>
                                            <div className="text-sm text-muted-foreground">{sub.userEmail}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{sub.examTitle}</TableCell>
                                <TableCell>
                                    <Badge variant={sub.percentage >= passPercentage ? 'default' : 'destructive'}>
                                        {sub.percentage}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                    {sub.submittedAt ? formatDistanceToNow(sub.submittedAt.toDate(), { addSuffix: true }) : 'N/A'}
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
                        )
                    })
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No submissions found.
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

export default function AdminSubmissionsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SubmissionsContent />
        </Suspense>
    )
}
