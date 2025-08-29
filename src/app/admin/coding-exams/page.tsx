
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, query, orderBy, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, PlusCircle, BarChart2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type CodingExam = {
  id: string;
  title: string;
  description: string;
  problemIds: string[];
  createdAt: Timestamp;
  isVisible: boolean;
};

export default function AdminCodingExamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [exams, setExams] = useState<CodingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<CodingExam | null>(null);

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
      fetchExams();
    }
  }, [adminUser]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const examsQuery = query(collection(db, 'coding_exams'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(examsQuery);
      const fetchedExams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodingExam));
      setExams(fetchedExams);
    } catch (error) {
      console.error('Error fetching coding exams:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch coding exams.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (examId: string, isVisible: boolean) => {
    try {
      const examDocRef = doc(db, 'coding_exams', examId);
      await updateDoc(examDocRef, { isVisible });
      setExams(prevExams => 
        prevExams.map(exam => 
          exam.id === examId ? { ...exam, isVisible } : exam
        )
      );
      toast({
        title: 'Success',
        description: `Exam visibility updated.`,
      });
    } catch (error) {
      console.error('Error updating exam visibility:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update visibility.',
      });
      // Revert UI on error
      setExams(prevExams => 
        prevExams.map(exam => 
          exam.id === examId ? { ...exam, isVisible: !isVisible } : exam
        )
      );
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await deleteDoc(doc(db, 'coding_exams', examToDelete.id));
      toast({ title: 'Success', description: `Exam "${examToDelete.title}" has been deleted.` });
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the exam.' });
    } finally {
      setExamToDelete(null);
    }
  };

  if (loading || !adminUser) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Coding Exams</h1>
          <p className="text-muted-foreground">Manage and create coding assessments.</p>
        </div>
        <Link href="/admin/coding-exams/new">
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Exam</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Coding Exams</CardTitle>
          <CardDescription>A list of all available coding assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Problems</TableHead>
                <TableHead>Visible to Users</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : exams.length > 0 ? (
                exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.problemIds.length}</TableCell>
                     <TableCell>
                       <div className="flex items-center space-x-2">
                        <Switch
                          id={`visibility-${exam.id}`}
                          checked={exam.isVisible}
                          onCheckedChange={(checked) => handleVisibilityChange(exam.id, checked)}
                        />
                        <Label htmlFor={`visibility-${exam.id}`} className="sr-only">Toggle exam visibility</Label>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {exam.createdAt ? formatDistanceToNow(exam.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/coding-exams/${exam.id}/analytics`}>
                        <Button variant="outline" size="icon"><BarChart2 className="h-4 w-4" /></Button>
                      </Link>
                      <Link href={`/admin/coding-exams/${exam.id}`}>
                        <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <AlertDialog open={!!examToDelete && examToDelete.id === exam.id} onOpenChange={(open) => !open && setExamToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => setExamToDelete(exam)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the exam "{examToDelete?.title}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteExam}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No coding exams created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
