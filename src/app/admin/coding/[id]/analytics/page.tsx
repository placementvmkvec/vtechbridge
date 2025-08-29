
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, XCircle, BrainCircuit, Eye, Download, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import Markdown from 'react-markdown';
import { analyzeCodingProblem } from '@/ai/flows/analyze-coding-problem-flow';
import type { CodingAnalysisInput, CodingAnalysisOutput } from '@/ai/schemas/coding-analysis-schemas';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as xlsx from 'xlsx';


const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

type TestCase = { input: string; output: string; };
type EvaluationResult = { passed: boolean; isPublic: boolean; testCaseIndex: number; };

type CodingProblem = {
    id: string;
    title: string;
    publicTestCases: TestCase[];
    privateTestCases: TestCase[];
    pointsPerCase?: number;
};

type Submission = {
    id: string;
    userName: string;
    userEmail: string;
    score: number;
    results: EvaluationResult[];
};

type TestCaseAnalytics = {
    name: string;
    passed: number;
    failed: number;
};

type ScoreDistribution = {
    range: string;
    count: number;
}

export default function CodingProblemAnalyticsPage() {
    const params = useParams();
    const problemId = params.id as string;
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [analytics, setAnalytics] = useState<TestCaseAnalytics[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);

    const [isGeneratingAIReport, setIsGeneratingAIReport] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<CodingAnalysisOutput | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (currentUser.email === ADMIN_EMAIL) {
                    setUser(currentUser);
                } else {
                    // Redirect non-admins
                }
            } else {
                // Redirect non-logged-in users
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user && problemId) {
            fetchAnalyticsData();
        }
    }, [user, problemId]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const problemDocRef = doc(db, 'coding_problems', problemId);
            const problemDoc = await getDoc(problemDocRef);
            if (!problemDoc.exists()) {
                toast({ variant: 'destructive', title: "Error", description: "Problem not found." });
                setLoading(false);
                return;
            }
            const problemData = { id: problemDoc.id, ...problemDoc.data() } as CodingProblem;
            setProblem(problemData);

            const submissionsQuery = query(collection(db, 'coding_submissions'), where('problemId', '==', problemId));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const fetchedSubmissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
            setSubmissions(fetchedSubmissions.sort((a,b) => b.score - a.score));

            if (fetchedSubmissions.length === 0) {
                setLoading(false);
                return;
            }

            const publicCasesCount = problemData.publicTestCases.length;
            const privateCasesCount = problemData.privateTestCases.length;
            const totalCases = publicCasesCount + privateCasesCount;
            
            const analyticsData: TestCaseAnalytics[] = Array.from({ length: totalCases }, (_, i) => ({
                name: i < publicCasesCount ? `Public #${i + 1}` : `Private #${i - publicCasesCount + 1}`,
                passed: 0,
                failed: 0,
            }));

            fetchedSubmissions.forEach(sub => {
                sub.results.forEach(res => {
                    const index = res.isPublic ? res.testCaseIndex : publicCasesCount + res.testCaseIndex;
                    if (analyticsData[index]) {
                        if (res.passed) {
                            analyticsData[index].passed++;
                        } else {
                            analyticsData[index].failed++;
                        }
                    }
                });
            });
            setAnalytics(analyticsData);

             // Score Distribution
            const maxScore = problemData.privateTestCases.length * (problemData.pointsPerCase || 10);
            const scoreRanges = Array.from({length: 10}, (_, i) => ({
                range: `${i*10}-${i*10+10}%`,
                count: 0,
            }));
             fetchedSubmissions.forEach(sub => {
                const percentage = maxScore > 0 ? (sub.score / maxScore) * 100 : 0;
                const rangeIndex = Math.floor(percentage / 10);
                 if (scoreRanges[rangeIndex] && scoreRanges[rangeIndex].count !== undefined) {
                    if (percentage === 100) { // Handle 100% case
                        scoreRanges[9].count++;
                    } else {
                        scoreRanges[rangeIndex].count++;
                    }
                }
            });
            setScoreDistribution(scoreRanges);

        } catch (error) {
            console.error("Error fetching analytics data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to fetch analytics." });
        } finally {
            setLoading(false);
        }
    };
    
    const handleGenerateAIReport = async () => {
        if (!problem || submissions.length === 0) {
            toast({ variant: 'destructive', title: "Not enough data", description: "Cannot generate a report without submissions."});
            return;
        }
        setIsGeneratingAIReport(true);
        try {
            const analysisInput: CodingAnalysisInput = {
                problemTitle: problem.title,
                testCaseAnalytics: analytics.map((tc, index) => ({
                    index: index + 1,
                    type: tc.name.startsWith('Public') ? 'Public' : 'Private',
                    passedCount: tc.passed,
                    failedCount: tc.failed
                })),
                studentPerformances: submissions.map(s => ({
                    userName: s.userName,
                    score: s.score,
                }))
            };
            const result = await analyzeCodingProblem(analysisInput);
            setAiAnalysis(result);
        } catch(error) {
            console.error("AI Analysis failed:", error);
            toast({ variant: 'destructive', title: "AI Analysis Failed", description: "There was an error generating the AI report."});
        } finally {
            setIsGeneratingAIReport(false);
        }
    }

    const downloadExcelReport = () => {
        const wb = xlsx.utils.book_new();

        // Test Case Analytics Sheet
        const testCaseData = analytics.map(tc => ({
            "Test Case": tc.name,
            "Passed": tc.passed,
            "Failed": tc.failed,
            "Success Rate (%)": tc.passed + tc.failed > 0 ? Math.round((tc.passed / (tc.passed + tc.failed)) * 100) : 0,
        }));
        const wsTestCases = xlsx.utils.json_to_sheet(testCaseData);
        xlsx.utils.book_append_sheet(wb, wsTestCases, "Test Case Analytics");

        // Student Performance Sheet
        const studentData = submissions.map(s => ({
            "Student Name": s.userName,
            "Email": s.userEmail,
            "Score": s.score,
        }));
        const wsStudents = xlsx.utils.json_to_sheet(studentData);
        xlsx.utils.book_append_sheet(wb, wsStudents, "Student Performance");

        xlsx.writeFile(wb, `${problem?.title}_Analytics_Report.xlsx`);
    }

    const downloadPdfReport = () => {
        const doc = new jsPDF();
        const maxScore = (problem?.privateTestCases?.length || 0) * (problem?.pointsPerCase || 10);

        // Title
        doc.setFontSize(18);
        doc.text(`Analytics Report for: ${problem?.title}`, 14, 22);

        // AI Summary if available
        if (aiAnalysis?.analysisSummary) {
            doc.setFontSize(14);
            doc.text("AI-Powered Analysis", 14, 40);
            const splitText = doc.splitTextToSize(aiAnalysis.analysisSummary.replace(/(\*\*|#+\s*|`)/g, ''), 180);
            doc.setFontSize(10);
            doc.text(splitText, 14, 48);
        }
        
        // --- PAGE 2: Test Case Performance ---
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Test Case Performance Analysis", 14, 22);
        (doc as any).autoTable({
            startY: 30,
            head: [['Test Case', 'Passed', 'Failed', 'Success Rate']],
            body: analytics.map(tc => [
                tc.name, 
                tc.passed, 
                tc.failed, 
                `${tc.passed + tc.failed > 0 ? Math.round((tc.passed / (tc.passed + tc.failed)) * 100) : 'N/A'}%`
            ]),
        });
        
        // --- PAGE 3: Student Performance ---
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Student Performance Analysis", 14, 22);
         (doc as any).autoTable({
            startY: 30,
            head: [['Student Name', 'Email', 'Score', 'Percentage']],
            body: submissions.map(s => [
                s.userName,
                s.userEmail,
                s.score,
                `${maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 'N/A'}%`
            ]),
        });

        doc.save(`${problem?.title}_Analytics_Report.pdf`);
    };
    
    if (loading) {
        return (
             <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-96 w-full" />
             </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
             <div className="flex justify-between items-center">
                <Link href="/admin/coding">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Problems List
                    </Button>
                </Link>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadExcelReport} disabled={loading || analytics.length === 0}>
                        <FileText className="mr-2 h-4 w-4" /> Download Excel
                    </Button>
                     <Button variant="outline" onClick={downloadPdfReport} disabled={loading || analytics.length === 0}>
                        <File className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Coding Problem Analytics</CardTitle>
                    <CardDescription>
                        Performance breakdown for: "{problem?.title || 'Loading...'}"
                    </CardDescription>
                </CardHeader>
            </Card>
            
            {submissions.length === 0 ? (
                 <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No submissions found for this problem yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                 <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-6 w-6 text-primary" />
                                AI-Powered Analysis
                            </CardTitle>
                            <CardDescription>An intelligent summary of student performance on this problem.</CardDescription>
                        </div>
                        <Button onClick={handleGenerateAIReport} disabled={isGeneratingAIReport}>
                            {isGeneratingAIReport ? 'Generating...' : 'Generate AI Report'}
                        </Button>
                    </CardHeader>
                    {aiAnalysis && (
                        <CardContent>
                             <div className="prose prose-sm dark:prose-invert max-w-full bg-secondary p-4 rounded-lg">
                                <Markdown>{aiAnalysis.analysisSummary}</Markdown>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Test Case Performance</CardTitle>
                            <CardDescription>Success vs. Failure rate for each test case.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={analytics}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Legend />
                                    <Bar dataKey="passed" stackId="a" fill="hsl(var(--chart-1))" name="Passed" />
                                    <Bar dataKey="failed" stackId="a" fill="hsl(var(--chart-2))" name="Failed" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Score Distribution</CardTitle>
                            <CardDescription>How many students fell into each score percentage bracket.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={scoreDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                    <Legend />
                                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Number of Students" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Test Case Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test Case</TableHead>
                                        <TableHead className="text-center">Passed</TableHead>
                                        <TableHead className="text-center">Failed</TableHead>
                                        <TableHead className="text-center">Success Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.map((tc) => (
                                        <TableRow key={tc.name}>
                                            <TableCell className="font-medium text-sm">{tc.name}</TableCell>
                                            <TableCell className="text-center text-green-600 font-bold">
                                                <div className="flex items-center justify-center gap-2">
                                                    <CheckCircle className="h-4 w-4" /> 
                                                    <span>{tc.passed}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-destructive font-bold">
                                                <div className="flex items-center justify-center gap-2">
                                                    <XCircle className="h-4 w-4" /> 
                                                    <span>{tc.failed}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {tc.passed + tc.failed > 0 ? `${Math.round((tc.passed / (tc.passed + tc.failed)) * 100)}%` : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Student Performance</CardTitle>
                             <CardDescription>List of all students who submitted a solution, sorted by score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-center">Score</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border">
                                                        <AvatarImage src={`https://placehold.co/100x100.png`} alt={sub.userName} data-ai-hint="user avatar" />
                                                        <AvatarFallback>{sub.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{sub.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                <Badge variant={sub.score > 0 ? 'default' : 'destructive'}>{sub.score}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/coding-submissions/${sub.id}`}>
                                                     <Button variant="outline" size="icon">
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View Submission</span>
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                </>
            )}
        </div>
    );
}
