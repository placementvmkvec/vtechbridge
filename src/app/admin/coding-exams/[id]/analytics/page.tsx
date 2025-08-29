
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
            });
            
            setAnalytics(finalAnalytics);

        } catch (error) {
            console.error("Error fetching analytics data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to fetch analytics." });
        } finally {
            setLoading(false);
        }
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Problem Performance</CardTitle>
                            <CardDescription>Average score for each problem in the exam.</CardDescription>
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
                            <CardTitle>Student Leaderboard</CardTitle>
                             <CardDescription>List of all students who completed this exam, sorted by score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-right">Total Score</TableHead>
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
                                            <TableCell className="text-right font-semibold">
                                                <Badge variant={sub.totalScore > 0 ? 'default' : 'destructive'}>{sub.totalScore}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
