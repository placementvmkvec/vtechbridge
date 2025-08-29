
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BrainCircuit, File, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as xlsx from 'xlsx';
import Markdown from 'react-markdown';
import { analyzeCodingExam } from '@/ai/flows/analyze-coding-exam-flow';
import type { CodingExamAnalysisInput, CodingExamAnalysisOutput } from '@/ai/schemas/coding-exam-analysis-schemas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

type CodingExam = {
  id: string;
  title: string;
  problemIds: string[];
  problemTitles: string[];
};

type Submission = {
  id: string;
  userName: string;
  userEmail: string;
  scores: Record<string, number>; // problemId -> score
  totalScore: number;
};

type ProblemAnalytics = {
  title: string;
  averageScore: number;
  submissionCount: number;
}

type ScoreDistribution = {
    range: string;
    count: number;
}

export default function CodingExamAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const examId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<CodingExam | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [analytics, setAnalytics] = useState<ProblemAnalytics[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
    const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);
    
    const [isGeneratingAIReport, setIsGeneratingAIReport] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<CodingExamAnalysisOutput | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.email === ADMIN_EMAIL) {
                setUser(currentUser);
            } else if (currentUser) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (user && examId) {
            fetchAnalyticsData();
        }
    }, [user, examId]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const examDocRef = doc(db, 'coding_exams', examId);
            const examDoc = await getDoc(examDocRef);

            if (!examDoc.exists()) {
                toast({ variant: 'destructive', title: "Error", description: "Exam not found." });
                setLoading(false);
                return;
            }
            const examData = { id: examDoc.id, ...examDoc.data() } as CodingExam;
            setExam(examData);

            const submissionsQuery = query(collection(db, 'coding_exam_submissions'), where('examId', '==', examId));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const fetchedSubmissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
            setSubmissions(fetchedSubmissions.sort((a, b) => b.totalScore - a.totalScore));

            if (fetchedSubmissions.length === 0) {
                setLoading(false);
                return;
            }
            
            // Calculate analytics per problem
            const problemAnalytics: Record<string, { totalScore: number, count: number }> = {};
            examData.problemIds.forEach(id => {
                problemAnalytics[id] = { totalScore: 0, count: 0 };
            });

            fetchedSubmissions.forEach(sub => {
                for(const problemId in sub.scores) {
                    if (problemAnalytics[problemId]) {
                        problemAnalytics[problemId].totalScore += sub.scores[problemId];
                        problemAnalytics[problemId].count++;
                    }
                }
            });

            const finalAnalytics: ProblemAnalytics[] = examData.problemIds.map((id, index) => {
                const { totalScore, count } = problemAnalytics[id];
                return {
                    title: examData.problemTitles[index] || `Problem ${index + 1}`,
                    averageScore: count > 0 ? Math.round(totalScore / count) : 0,
                    submissionCount: count,
                }
            }).sort((a, b) => a.averageScore - b.averageScore);
            
            setAnalytics(finalAnalytics);

            // Calculate score distribution
            let maxScore = 0;
            // This part is tricky as max score depends on number of private cases for each problem
            // For now, let's assume a max of 100 for simplicity or calculate it if possible.
            // A simple sum of scores is not a percentage. Let's create ranges based on absolute score.
             const scoreRanges: ScoreDistribution[] = Array.from({length: 10}, (_, i) => ({
                range: `${i*10 + 1}-${(i+1)*10}`,
                count: 0,
            }));
             fetchedSubmissions.forEach(sub => {
                const score = sub.totalScore;
                if(score === 0) return;
                const rangeIndex = Math.ceil(score / 10) - 1;
                if (scoreRanges[rangeIndex]) {
                     scoreRanges[rangeIndex].count++;
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
    
    const handleDeleteSubmission = async () => {
        if (!submissionToDelete) return;
        try {
            await deleteDoc(doc(db, 'coding_exam_submissions', submissionToDelete.id));
            toast({
                title: 'Success',
                description: `Submission from "${submissionToDelete.userName}" has been deleted. They can now re-attempt the exam.`,
            });
            fetchAnalyticsData(); // Refresh the list
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
    
    const handleGenerateAIReport = async () => {
        if (!exam || submissions.length === 0 || analytics.length === 0) {
            toast({ variant: 'destructive', title: "Not enough data", description: "Cannot generate a report without submissions."});
            return;
        }
        setIsGeneratingAIReport(true);
        try {
            const analysisInput: CodingExamAnalysisInput = {
                examTitle: exam.title,
                problemAnalytics: analytics,
                studentPerformances: submissions.map(s => ({
                    userName: s.userName,
                    totalScore: s.totalScore,
                })),
            };
            const result = await analyzeCodingExam(analysisInput);
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

        // Problem Analytics Sheet
        const problemData = analytics.map(p => ({
            "Problem Title": p.title,
            "Average Score": p.averageScore,
            "Submission Count": p.submissionCount,
        }));
        const wsProblems = xlsx.utils.json_to_sheet(problemData);
        xlsx.utils.book_append_sheet(wb, wsProblems, "Problem Analytics");

        // Student Performance Sheet
        const studentData = submissions.map(s => ({
            "Student Name": s.userName,
            "Email": s.userEmail,
            "Total Score": s.totalScore,
        }));
        const wsStudents = xlsx.utils.json_to_sheet(studentData);
        xlsx.utils.book_append_sheet(wb, wsStudents, "Student Performance");

        xlsx.writeFile(wb, `${exam?.title}_Analytics_Report.xlsx`);
    }

    const downloadPdfReport = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text(`Analytics Report for: ${exam?.title}`, 14, 22);

        // AI Summary if available
        if (aiAnalysis?.analysisSummary) {
            doc.setFontSize(14);
            doc.text("AI-Powered Analysis", 14, 40);
            const splitText = doc.splitTextToSize(aiAnalysis.analysisSummary.replace(/(\*\*|#+\s*|`)/g, ''), 180);
            doc.setFontSize(10);
            doc.text(splitText, 14, 48);
        }
        
        // --- PAGE 2: Problem Performance ---
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Problem Performance Analysis", 14, 22);
        (doc as any).autoTable({
            startY: 30,
            head: [['Problem', 'Average Score', 'Submissions']],
            body: analytics.map(p => [ p.title, p.averageScore, p.submissionCount ]),
        });
        
        // --- PAGE 3: Student Leaderboard ---
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Student Leaderboard", 14, 22);
         (doc as any).autoTable({
            startY: 30,
            head: [['Student Name', 'Email', 'Total Score']],
            body: submissions.map(s => [ s.userName, s.userEmail, s.totalScore ]),
        });

        doc.save(`${exam?.title}_Analytics_Report.pdf`);
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
                <Link href="/admin/coding-exams">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exams List
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadExcelReport} disabled={submissions.length === 0}>
                        <FileText className="mr-2 h-4 w-4" /> Download Excel
                    </Button>
                     <Button variant="outline" onClick={downloadPdfReport} disabled={submissions.length === 0}>
                        <File className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Coding Exam Analytics</CardTitle>
                    <CardDescription>
                        Performance breakdown for: "{exam?.title || 'Loading...'}"
                    </CardDescription>
                </CardHeader>
            </Card>
            
            {submissions.length === 0 && !loading ? (
                 <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No submissions found for this exam yet.</p>
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
                            <CardDescription>An intelligent summary of this exam's performance.</CardDescription>
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Problem Performance</CardTitle>
                            <CardDescription>Average score for each problem in the exam (sorted by difficulty).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={analytics}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis 
                                        type="category" 
                                        dataKey="title" 
                                        width={100}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Legend />
                                    <Bar dataKey="averageScore" fill="hsl(var(--chart-1))" name="Avg. Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Overall Score Distribution</CardTitle>
                            <CardDescription>How many students fell into each total score bracket.</CardDescription>
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

                <div className="grid grid-cols-1 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Leaderboard</CardTitle>
                             <CardDescription>List of all students who completed this exam, sorted by score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-center">Total Score</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border">
                                                        <AvatarImage src={`https://placehold.co/100x100.png`} alt={sub.userName} data-ai-hint="user avatar"/>
                                                        <AvatarFallback>{sub.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{sub.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                <Badge variant={sub.totalScore > 0 ? 'default' : 'destructive'}>{sub.totalScore}</Badge>
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
                                                            This action will permanently delete this submission. The user will be able to re-attempt the exam.
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
