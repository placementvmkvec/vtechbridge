
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Shield, Unlock, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type TestCase = {
  input: string;
  output: string;
};

type CodingProblem = {
  id: string;
  title: string;
  language: string;
  problemStatement: string;
  publicTestCases: TestCase[];
  privateTestCases: TestCase[];
  pointsPerCase: number;
  createdAt: Timestamp;
};

export default function EditCodingProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;
  const { toast } = useToast();
  
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [pointsPerCase, setPointsPerCase] = useState(10);
  const [publicTestCases, setPublicTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);
  const [privateTestCases, setPrivateTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);

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
    if (adminUser && problemId) {
      const fetchProblemData = async () => {
        setLoading(true);
        try {
          const problemDocRef = doc(db, 'coding_problems', problemId);
          const problemDoc = await getDoc(problemDocRef);
          if (problemDoc.exists()) {
            const problemData = problemDoc.data() as Omit<CodingProblem, 'id'>;
            setTitle(problemData.title);
            setLanguage(problemData.language);
            setProblemStatement(problemData.problemStatement);
            setPointsPerCase(problemData.pointsPerCase);
            setPublicTestCases(problemData.publicTestCases.length > 0 ? problemData.publicTestCases : [{ input: '', output: '' }]);
            setPrivateTestCases(problemData.privateTestCases.length > 0 ? problemData.privateTestCases : [{ input: '', output: '' }]);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Coding problem not found.' });
            router.push('/admin/coding');
          }
        } catch (error) {
          console.error('Error fetching problem data:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch problem data.' });
        } finally {
          setLoading(false);
        }
      };
      fetchProblemData();
    }
  }, [adminUser, problemId, router, toast]);

  const handleAddTestCase = (type: 'public' | 'private') => {
    if (type === 'public') {
      setPublicTestCases([...publicTestCases, { input: '', output: '' }]);
    } else {
      setPrivateTestCases([...privateTestCases, { input: '', output: '' }]);
    }
  };

  const handleRemoveTestCase = (type: 'public' | 'private', index: number) => {
    if (type === 'public' && publicTestCases.length > 1) {
      setPublicTestCases(publicTestCases.filter((_, i) => i !== index));
    } else if (type === 'private' && privateTestCases.length > 1) {
      setPrivateTestCases(privateTestCases.filter((_, i) => i !== index));
    }
  };

  const handleTestCaseChange = (type: 'public' | 'private', index: number, field: 'input' | 'output', value: string) => {
    if (type === 'public') {
      const newTestCases = [...publicTestCases];
      newTestCases[index][field] = value;
      setPublicTestCases(newTestCases);
    } else {
      const newTestCases = [...privateTestCases];
      newTestCases[index][field] = value;
      setPrivateTestCases(newTestCases);
    }
  };

  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const finalPublicTestCases = publicTestCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');
    const finalPrivateTestCases = privateTestCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');

    if (!title || !language || !problemStatement || pointsPerCase <= 0 || finalPrivateTestCases.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all required fields and provide at least one valid private test case.',
      });
      setIsUpdating(false);
      return;
    }

    try {
      const problemDocRef = doc(db, 'coding_problems', problemId);
      await updateDoc(problemDocRef, {
        title,
        language,
        problemStatement,
        pointsPerCase,
        publicTestCases: finalPublicTestCases,
        privateTestCases: finalPrivateTestCases,
      });
      toast({ title: 'Success!', description: `Successfully updated coding problem: "${title}"` });
      router.push('/admin/coding');
    } catch (error: any) {
      console.error('Error updating coding problem:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !adminUser) {
    return (
        <div className="container mx-auto py-8 space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
        <div className="mb-4">
            <Link href="/admin/coding">
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Problems List</Button>
            </Link>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Coding Problem</CardTitle>
          <CardDescription>Update the details of the coding challenge.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProblem} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coding-title">Problem Title</Label>
                <Input id="coding-title" name="coding-title" placeholder="e.g., Two Sum" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Programming Language</Label>
                <Select name="language" required value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="swift">Swift</SelectItem>
                    <SelectItem value="kotlin">Kotlin</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem-statement">Problem Statement (Supports Markdown)</Label>
              <Textarea id="problem-statement" name="problem-statement" value={problemStatement} onChange={e => setProblemStatement(e.target.value)} placeholder="Describe the coding challenge..." rows={10} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points-per-case">Points Per Private Test Case</Label>
              <Input id="points-per-case" name="points-per-case" type="number" value={pointsPerCase} onChange={e => setPointsPerCase(Number(e.target.value))} required placeholder="e.g., 10" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Unlock className="h-4 w-4 text-green-600" /> Public Test Cases</Label>
                <p className="text-xs text-muted-foreground">These are visible to the user for basic testing. At least one is recommended.</p>
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/50">
                  {publicTestCases.map((testCase, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-grow">
                        <Textarea placeholder={`Public Input ${index + 1}`} value={testCase.input} onChange={(e) => handleTestCaseChange('public', index, 'input', e.target.value)} rows={2} />
                        <Textarea placeholder={`Public Output ${index + 1}`} value={testCase.output} onChange={(e) => handleTestCaseChange('public', index, 'output', e.target.value)} rows={2} />
                      </div>
                      {publicTestCases.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTestCase('public', index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase('public')}><PlusCircle className="mr-2 h-4 w-4" /> Add Public Case</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-600" /> Private Test Cases (Required)</Label>
                <p className="text-xs text-muted-foreground">These are hidden and used for final scoring. At least one is required.</p>
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/50">
                  {privateTestCases.map((testCase, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-grow">
                        <Textarea placeholder={`Private Input ${index + 1}`} value={testCase.input} onChange={(e) => handleTestCaseChange('private', index, 'input', e.target.value)} required rows={2} />
                        <Textarea placeholder={`Private Output ${index + 1}`} value={testCase.output} onChange={(e) => handleTestCaseChange('private', index, 'output', e.target.value)} required rows={2} />
                      </div>
                      {privateTestCases.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTestCase('private', index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase('private')}><PlusCircle className="mr-2 h-4 w-4" /> Add Private Case</Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Problem'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
