
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs, query, orderBy, Timestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { ClipboardList, Users, CheckCircle, Upload, Trash2, Eye, BarChart2, Code, PlusCircle, X, Shield, Unlock } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as xlsx from 'xlsx';
import { formatDistanceToNow } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

const chartConfig = {
  passed: { label: "Passed", color: "hsl(var(--chart-1))" },
  failed: { label: "Failed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type ExamData = {
    id: string;
    passPercentage: number;
    title: string;
    questionCount: number;
    createdAt: Timestamp;
}

type Submission = {
    id: string;
    userName: string;
    userEmail: string;
    examId: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: Timestamp;
}

type TestCase = {
    input: string;
    output: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isCreatingCodingProblem, setIsCreatingCodingProblem] = useState(false);

  const [examFormRef, setExamFormRef] = useState<HTMLFormElement | null>(null);
  const [codingFormRef, setCodingFormRef] = useState<HTMLFormElement | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({ totalExams: 0, totalUsers: 0, submissionsToday: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, ExamData>>({});
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  const [publicTestCases, setPublicTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);
  const [privateTestCases, setPrivateTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email !== ADMIN_EMAIL) {
          router.push('/dashboard');
        } else {
            setUser(currentUser);
            fetchDashboardData();
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        // Fetch exams
        const examsQuery = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const examsSnapshot = await getDocs(examsQuery);
        const examsData = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExamData[];
        const examsDataMap = examsData.reduce((acc, exam) => {
            acc[exam.id] = exam;
            return acc;
        }, {} as Record<string, ExamData>);
        setExamsMap(examsDataMap);
        const totalExams = examsSnapshot.size;

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;
        
        // Fetch submissions
        const submissionsQuery = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const fetchedSubmissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
        setSubmissions(fetchedSubmissions);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const submissionsToday = fetchedSubmissions.filter(s => s.submittedAt && s.submittedAt.toDate() >= today).length;

        setStats({ totalExams, totalUsers, submissionsToday });
        
        // Process chart data
        processChartData(fetchedSubmissions, examsDataMap);

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load dashboard data.' });
    } finally {
        setLoading(false);
    }
  }

  const processChartData = (submissionsData: Submission[], examsDataMap: Record<string, ExamData>) => {
      const examPerformance: { [key: string]: { passed: number, failed: number } } = {};
      let totalPassed = 0;
      let totalFailed = 0;

      submissionsData.forEach(sub => {
          const exam = examsDataMap[sub.examId];
          const passPercentage = exam?.passPercentage ?? 50; // Default to 50 if not set

          if (!examPerformance[sub.examTitle]) {
              examPerformance[sub.examTitle] = { passed: 0, failed: 0 };
          }
          if (sub.percentage >= passPercentage) {
              examPerformance[sub.examTitle].passed++;
              totalPassed++;
          } else {
              examPerformance[sub.examTitle].failed++;
              totalFailed++;
          }
      });
      
      const barChart = Object.keys(examPerformance).map(examTitle => ({
          exam: examTitle,
          passed: examPerformance[examTitle].passed,
          failed: examPerformance[examTitle].failed,
      }));
      setChartData(barChart);

      const pieChart = [
        { name: 'Passed', value: totalPassed, color: 'hsl(var(--chart-1))' },
        { name: 'Failed', value: totalFailed, color: 'hsl(var(--chart-2))' }
      ];
      setPieChartData(pieChart);
  }

  const handleCreateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = examFormRef;
    if (!form) return;
    
    setIsCreatingExam(true);
    
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = Number(formData.get('duration'));
    const passPercentage = Number(formData.get('passPercentage'));
    const file = formData.get('questions-file') as File;
    const numSets = Number(formData.get('numSets'));
    const questionsPerSet = Number(formData.get('questionsPerSet'));

    if (!file || !title || !duration || !passPercentage || !numSets || !questionsPerSet) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
      setIsCreatingExam(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
            setIsCreatingExam(false);
            return;
        }
        
        const fileData = event.target.result;
        const workbook = xlsx.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawQuestions: any[] = xlsx.utils.sheet_to_json(worksheet, { 
            header: ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer"], 
            defval: "",
            skipHeader: false
        });

        if (rawQuestions.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No questions found in the file.' });
            setIsCreatingExam(false);
            return;
        }

        const totalRequiredQuestions = numSets * questionsPerSet;
        if (rawQuestions.length < totalRequiredQuestions) {
             toast({ variant: 'destructive', title: 'Error', description: `Not enough questions in file. Required: ${totalRequiredQuestions}, Found: ${rawQuestions.length}` });
             setIsCreatingExam(false);
             return;
        }

        const structuredQuestions: Question[] = rawQuestions.map((q, index) => ({
            id: `q_${index + 1}`,
            question: (q['Question'] || '').toString().trim(),
            options: [
                (q['Option A'] || '').toString().trim(), 
                (q['Option B'] || '').toString().trim(), 
                (q['Option C'] || '').toString().trim(), 
                (q['Option D'] || '').toString().trim()
            ].filter(opt => opt),
            correctAnswer: (q['Correct Answer'] || '').toString().trim()
        }));
        
        // Shuffle questions to randomize set creation
        const shuffledQuestions = structuredQuestions.sort(() => 0.5 - Math.random());

        const questionSets: Record<string, Question[]> = {};
        let questionIndex = 0;
        for (let i = 0; i < numSets; i++) {
            const setKey = `set${i + 1}`;
            questionSets[setKey] = shuffledQuestions.slice(questionIndex, questionIndex + questionsPerSet);
            questionIndex += questionsPerSet;
        }
        
        const examsCollectionRef = collection(db, 'exams');
        const newExamRef = doc(examsCollectionRef);
        const examId = newExamRef.id;

        await setDoc(newExamRef, {
            id: examId,
            title: title,
            description: description,
            duration: duration,
            passPercentage: passPercentage,
            questionCount: questionsPerSet, // Now it's questions per set
            questionSets: questionSets,
            createdAt: new Date(),
        });
        
        toast({ title: 'Success!', description: `Successfully created exam with ${numSets} sets of ${questionsPerSet} questions.` });
        form.reset();
        fetchDashboardData(); // Refresh data

      } catch (error: any) {
        console.error('Error creating exam:', error);
        toast({ variant: 'destructive', title: 'Exam Creation Failed', description: error.message });
      } finally {
        setIsCreatingExam(false);
      }
    };
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
        setIsCreatingExam(false);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
        await deleteDoc(doc(db, 'submissions', submissionToDelete.id));
        toast({ title: 'Success', description: `Submission for ${submissionToDelete.userEmail} has been deleted.` });
        fetchDashboardData(); // Refresh the list
    } catch (error) {
        console.error("Error deleting submission:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the submission.' });
    } finally {
        setSubmissionToDelete(null);
    }
  }

  const handleAddTestCase = (type: 'public' | 'private') => {
    if (type === 'public') {
      setPublicTestCases([...publicTestCases, { input: '', output: '' }]);
    } else {
      setPrivateTestCases([...privateTestCases, { input: '', output: '' }]);
    }
  };

  const handleRemoveTestCase = (type: 'public' | 'private', index: number) => {
    if (type === 'public') {
      setPublicTestCases(publicTestCases.filter((_, i) => i !== index));
    } else {
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

  const handleCreateCodingProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = codingFormRef;
    if (!form) return;

    setIsCreatingCodingProblem(true);
    
    const formData = new FormData(form);
    const title = formData.get('coding-title') as string;
    const language = formData.get('language') as string;
    const problemStatement = formData.get('problem-statement') as string;
    const pointsPerCase = Number(formData.get('points-per-case'));

    const finalPublicTestCases = publicTestCases.filter(tc => tc.input.trim() !== '' && tc.output.trim() !== '');
    const finalPrivateTestCases = privateTestCases.filter(tc => tc.input.trim() !== '' && tc.output.trim() !== '');

    if (!title || !language || !problemStatement || !pointsPerCase || finalPrivateTestCases.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields and provide at least one valid private test case.' });
      setIsCreatingCodingProblem(false);
      return;
    }

    try {
      const codingProblemsCollectionRef = collection(db, 'coding_problems');
      await addDoc(codingProblemsCollectionRef, {
        title,
        language,
        problemStatement,
        pointsPerCase,
        publicTestCases: finalPublicTestCases,
        privateTestCases: finalPrivateTestCases,
        createdAt: new Date(),
      });
      
      toast({ title: 'Success!', description: `Successfully created coding problem: "${title}"` });
      form.reset();
      setPublicTestCases([{ input: '', output: '' }]);
      setPrivateTestCases([{ input: '', output: '' }]);


    } catch (error: any) {
        console.error('Error creating coding problem:', error);
        toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    } finally {
        setIsCreatingCodingProblem(false);
    }
  };


  const isAdmin = user?.email === ADMIN_EMAIL;

  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 container mx-auto">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Link href="/admin/exams">
            <Card className="shadow-sm hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExams}</div>
                <p className="text-xs text-muted-foreground">Active exams available to users</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/users">
            <Card className="shadow-sm hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users in the system</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/submissions">
            <Card className="shadow-sm hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submissionsToday}</div>
                <p className="text-xs text-muted-foreground">Total tests submitted today</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">Create New Content</CardTitle>
              <CardDescription>Create a Multiple Choice Exam or a Coding Challenge.</CardDescription>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="mcq" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mcq"><Upload className="mr-2 h-4 w-4"/> Multiple Choice</TabsTrigger>
                    <TabsTrigger value="coding"><Code className="mr-2 h-4 w-4"/> Coding Problem</TabsTrigger>
                </TabsList>
                <TabsContent value="mcq"  className="pt-4">
                  <form ref={setExamFormRef} onSubmit={handleCreateExam} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Exam Title</Label>
                      <Input id="title" name="title" required placeholder="e.g., Mid-term Examination" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="A short description of the exam." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input id="duration" name="duration" type="number" required placeholder="e.g., 60" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passPercentage">Pass Percentage (%)</Label>
                            <Input id="passPercentage" name="passPercentage" type="number" required placeholder="e.g., 50" min="0" max="100" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="numSets">Number of Sets</Label>
                          <Input id="numSets" name="numSets" type="number" required placeholder="e.g., 5" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="questionsPerSet">Questions Per Set</Label>
                            <Input id="questionsPerSet" name="questionsPerSet" type="number" required placeholder="e.g., 20" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questions-file">Questions File (.xlsx)</Label>
                      <Input id="questions-file" name="questions-file" type="file" required accept=".xlsx" />
                      <p className="text-xs text-muted-foreground">
                        Excel columns: Question, Option A, Option B, Option C, Option D, Correct Answer
                      </p>
                    </div>
                    <Button type="submit" disabled={isCreatingExam}>
                      {isCreatingExam ? 'Creating Exam...' : 'Create Exam'}
                    </Button>
                  </form>
                </TabsContent>
                 <TabsContent value="coding" className="pt-4">
                   <form ref={setCodingFormRef} onSubmit={handleCreateCodingProblem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coding-title">Problem Title</Label>
                                <Input id="coding-title" name="coding-title" placeholder="e.g., Two Sum" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Programming Language</Label>
                                <Select name="language" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
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
                            <Textarea id="problem-statement" name="problem-statement" placeholder="Describe the coding challenge..." rows={6} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="points-per-case">Points Per Private Test Case</Label>
                            <Input id="points-per-case" name="points-per-case" type="number" required placeholder="e.g., 10" />
                        </div>

                        {/* Public Test Cases */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Unlock className="h-4 w-4 text-green-600"/> Public Test Cases</Label>
                             <p className="text-xs text-muted-foreground">These are visible to the user for basic testing.</p>
                            <div className="border rounded-lg p-4 space-y-4 bg-secondary/50">
                                {publicTestCases.map((testCase, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="grid grid-cols-2 gap-2 flex-grow">
                                            <Textarea placeholder={`Public Input ${index + 1}`} value={testCase.input} onChange={(e) => handleTestCaseChange('public', index, 'input', e.target.value)} rows={1} />
                                            <Textarea placeholder={`Public Output ${index + 1}`} value={testCase.output} onChange={(e) => handleTestCaseChange('public', index, 'output', e.target.value)} rows={1} />
                                        </div>
                                        {publicTestCases.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTestCase('public', index)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase('public')}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Public Case
                                </Button>
                            </div>
                        </div>

                        {/* Private Test Cases */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-600"/> Private Test Cases (Required)</Label>
                             <p className="text-xs text-muted-foreground">These are hidden and used for final scoring.</p>
                            <div className="border rounded-lg p-4 space-y-4 bg-secondary/50">
                                {privateTestCases.map((testCase, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="grid grid-cols-2 gap-2 flex-grow">
                                            <Textarea placeholder={`Private Input ${index + 1}`} value={testCase.input} onChange={(e) => handleTestCaseChange('private', index, 'input', e.target.value)} required rows={1}/>
                                            <Textarea placeholder={`Private Output ${index + 1}`} value={testCase.output} onChange={(e) => handleTestCaseChange('private', index, 'output', e.target.value)} required rows={1}/>
                                        </div>
                                        {privateTestCases.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTestCase('private', index)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase('private')}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Private Case
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" disabled={isCreatingCodingProblem}>
                            {isCreatingCodingProblem ? 'Creating...' : 'Create Coding Problem'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
           <Card className="shadow-sm">
                 <CardHeader>
                    <CardTitle className="font-headline">Recent Submissions</CardTitle>
                    <CardDescription>The 10 most recent test submissions from users.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="hidden md:table-cell">Exam</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.length > 0 ? (
                           submissions.slice(0, 10).map(sub => {
                                const exam = examsMap[sub.examId];
                                const passPercentage = exam?.passPercentage ?? 50;
                                return (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="font-medium">{sub.userName}</div>
                                            <div className="text-xs text-muted-foreground">{sub.userEmail}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{sub.examTitle}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.percentage >= passPercentage ? 'default' : 'destructive'}>
                                                {sub.percentage}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">
                                            {sub.submittedAt ? formatDistanceToNow(sub.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                                        This will permanently delete the submission for <span className="font-bold">{submissionToDelete?.userName}</span> on the exam <span className="font-bold">"{submissionToDelete?.examTitle}"</span>. This allows the user to retake the test.
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
                                )
                           })
                        ) : (
                           <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">No recent submissions found.</TableCell>
                           </TableRow>
                        )}
                      </TableBody>
                    </Table>
                 </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Pass/Fail Rate Overview</CardTitle>
              <CardDescription>A look at pass vs fail rates across all exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Exam Performance</CardTitle>
              <CardDescription>Comparison of pass/fail counts for different exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="exam" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 10)} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="passed" fill="var(--color-passed)" radius={4} />
                  <Bar dataKey="failed" fill="var(--color-failed)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
