
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
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

const ADMIN_EMAIL = 'loganathans@vmkvec.edu.in';

type TestCase = {
  input: string;
  output: string;
};

export default function CreateCodingProblemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [pointsPerCase, setPointsPerCase] = useState(10);
  const [passPercentage, setPassPercentage] = useState(50);
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
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

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

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const finalPublicTestCases = publicTestCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');
    const finalPrivateTestCases = privateTestCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');

    if (!title || !language || !problemStatement || pointsPerCase <= 0 || finalPrivateTestCases.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all required fields and provide at least one valid private test case.',
      });
      setIsCreating(false);
      return;
    }

    try {
      await addDoc(collection(db, 'coding_problems'), {
        title,
        language,
        problemStatement,
        pointsPerCase,
        passPercentage,
        publicTestCases: finalPublicTestCases,
        privateTestCases: finalPrivateTestCases,
        createdAt: new Date(),
        isVisible: true,
      });
      toast({ title: 'Success!', description: `Successfully created coding problem: "${title}"` });
      router.push('/admin/coding');
    } catch (error: any) {
      console.error('Error creating coding problem:', error);
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || !adminUser) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
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
          <CardTitle>Create New Coding Problem</CardTitle>
          <CardDescription>Fill in the details to create a new coding challenge for students.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProblem} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="points-per-case">Points Per Private Test Case</Label>
                <Input id="points-per-case" name="points-per-case" type="number" value={pointsPerCase} onChange={e => setPointsPerCase(Number(e.target.value))} required placeholder="e.g., 10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pass-percentage">Pass Percentage (%)</Label>
                    <Input id="pass-percentage" name="pass-percentage" type="number" min="0" max="100" value={passPercentage} onChange={e => setPassPercentage(Number(e.target.value))} required placeholder="e.g., 50" />
                </div>
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
                <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Problem'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
