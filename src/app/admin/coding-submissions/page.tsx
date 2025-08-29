
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

type CodingSubmission = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    problemId: string;
    problemTitle: string;
    language: string;
    score: number;
    createdAt: Timestamp;
};

export default function AdminCodingSubmissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionToDelete, setSubmissionToDelete] = useState<CodingSubmission | null>(null);

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
  }, [adminUser]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const submissionsQuery = query(collection(db, 'coding_submissions'), orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(submissionsQuery);
      const fetchedSubmissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CodingSubmission[];
      
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    try {
      await deleteDoc(doc(db, 'coding_submissions', submissionToDelete.id));
      toast({
        title: 'Success',
        description: `Submission from "${submissionToDelete.userName}" has been deleted. They can now re-attempt.`,
      });
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete submission.',
      });
    } finally {
      setSubmissionToDelete(null);
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
        <Card>
        <CardHeader>
            <CardTitle>Coding Submissions</CardTitle>
            <CardDescription>A list of all coding challenge submissions from users.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Problem</TableHead>
                <TableHead>Score</TableHead>
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
                            <TableCell className="text-right space-x-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
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
                                        <AvatarFallback>{sub.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{sub.userName || 'N/A'}</div>
                                        <div className="text-sm text-muted-foreground">{sub.userEmail}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className='font-medium'>{sub.problemTitle}</div>
                                <Badge variant="secondary">{sub.language}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={sub.score > 0 ? 'default' : 'destructive'}>
                                    {sub.score}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {sub.createdAt ? formatDistanceToNow(sub.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Link href={`/admin/coding-submissions/${sub.id}`}>
                                    <Button variant="outline" size="icon">
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Details</span>
                                    </Button>
                                </Link>
                                <AlertDialog open={!!submissionToDelete && submissionToDelete.id === sub.id} onOpenChange={(open) => !open && setSubmissionToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" onClick={() => setSubmissionToDelete(sub)}>
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete Submission</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action will permanently delete this submission. The user will be able to re-attempt the problem.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteSubmission}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No coding submissions found.
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
