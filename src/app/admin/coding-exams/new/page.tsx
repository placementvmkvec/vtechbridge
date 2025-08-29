
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type CodingProblem = {
  id: string;
  title: string;
};

export default function CreateCodingExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passPercentage, setPassPercentage] = useState(50);
  const [allProblems, setAllProblems] = useState<CodingProblem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<CodingProblem[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setAdminUser(currentUser);
          fetchCodingProblems();
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchCodingProblems = async () => {
    try {
      const problemsSnapshot = await getDocs(collection(db, 'coding_problems'));
      const problems = problemsSnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title })) as CodingProblem[];
      setAllProblems(problems);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch coding problems.' });
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedProblems.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide a title and select at least one coding problem.' });
      return;
    }
    setIsCreating(true);
    try {
      await addDoc(collection(db, 'coding_exams'), {
        title,
        description,
        passPercentage,
        problemIds: selectedProblems.map(p => p.id),
        problemTitles: selectedProblems.map(p => p.title),
        createdAt: new Date(),
        isVisible: true, // Default to visible
      });
      toast({ title: 'Success!', description: `Successfully created coding exam: "${title}"` });
      router.push('/admin/coding-exams');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectProblem = (problem: CodingProblem) => {
    setSelectedProblems(prev => {
      if (prev.find(p => p.id === problem.id)) {
        return prev.filter(p => p.id !== problem.id);
      } else {
        return [...prev, problem];
      }
    });
    setPopoverOpen(false);
  };

  if (loading || !adminUser) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/admin/coding-exams">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Coding Exams</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Coding Exam</CardTitle>
          <CardDescription>Bundle multiple coding problems into a single timed assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateExam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-title">Exam Title</Label>
                <Input id="exam-title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Data Structures Final" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-percentage">Pass Percentage (%)</Label>
                <Input id="pass-percentage" type="number" min="0" max="100" value={passPercentage} onChange={e => setPassPercentage(Number(e.target.value))} required placeholder="e.g., 50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-description">Description</Label>
              <Textarea id="exam-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description of the exam." />
            </div>
            <div className="space-y-2">
              <Label>Select Coding Problems</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                      {selectedProblems.length > 0 ? selectedProblems.map(p => <Badge key={p.id} variant="secondary">{p.title}</Badge>) : "Select problems..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search problems..." />
                    <CommandList>
                      <CommandEmpty>No problems found.</CommandEmpty>
                      <CommandGroup>
                        {allProblems.map((problem) => (
                          <CommandItem key={problem.id} onSelect={() => handleSelectProblem(problem)}>
                            <Check className={cn("mr-2 h-4 w-4", selectedProblems.find(p => p.id === problem.id) ? "opacity-100" : "opacity-0")} />
                            {problem.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
