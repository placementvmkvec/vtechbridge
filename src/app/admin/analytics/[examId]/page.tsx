
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, DocumentData, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

type Question = {
    id: string;
    question: string;
    correctAnswer: string;
};

type Exam = {
    id: string;
    title: string;
    passPercentage: number;
    questionSets: Record<string, Question[]>;
};

type Submission = {
    id: string;
    userName: string;
    userEmail: string;
    percentage: number;
    answers: Record<string, string>;
};

type QuestionAnalytics = {
    questionId: string;
    questionText: string;
    correct: number;
    incorrect: number;
    total: number;
};

type ScoreDistribution = {
    range: string;
    count: number;
}


export default function ExamAnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.examId as string;

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<Exam | null>(null);
    const [analytics, setAnalytics] = useState<QuestionAnalytics[]>([]);
    const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (currentUser.email === ADMIN_EMAIL) {
                    setUser(currentUser);
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
        if (user && examId) {
            fetchAnalyticsData();
        }
    }, [user, examId]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            // Fetch Exam Data
            const examDocRef = doc(db, 'exams', examId);
            const examDoc = await getDoc(examDocRef);
            if (!examDoc.exists()) {
                console.error("Exam not found");
                setLoading(false);
                return;
            }
            const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
            setExam(examData);

            // Fetch Submissions for this exam
            const submissionsQuery = query(collection(db, 'submissions'), where('examId', '==', examId));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
            setStudentSubmissions(submissions.sort((a,b) => b.percentage - a.percentage));


            if (submissions.length === 0) {
                setLoading(false);
                return;
            }
            
            // Consolidate all questions from all sets into a single map
            const allQuestionsMap = new Map<string, Question>();
            Object.values(examData.questionSets).forEach(questionSet => {
                questionSet.forEach(q => {
                    allQuestionsMap.set(q.id, q);
                });
            });

            // Process Analytics
            const analyticsData: Record<string, { correct: number, incorrect: number }> = {};
            
            submissions.forEach(sub => {
                for (const questionId in sub.answers) {
                    if (allQuestionsMap.has(questionId)) {
                        const question = allQuestionsMap.get(questionId)!;
                        const userAnswer = sub.answers[questionId];

                        if (!analyticsData[questionId]) {
                            analyticsData[questionId] = { correct: 0, incorrect: 0 };
                        }

                        if (userAnswer === question.correctAnswer) {
                            analyticsData[questionId].correct++;
                        } else {
                            analyticsData[questionId].incorrect++;
                        }
                    }
                }
            });
            
            const processedAnalytics: QuestionAnalytics[] = Array.from(allQuestionsMap.values()).map(question => {
                const stats = analyticsData[question.id] || { correct: 0, incorrect: 0 };
                const total = stats.correct + stats.incorrect;
                return {
                    questionId: question.id,
                    questionText: question.question,
                    correct: stats.correct,
                    incorrect: stats.incorrect,
                    total: total,
                };
            }).sort((a, b) => b.incorrect - a.incorrect);

            setAnalytics(processedAnalytics);

            // Process Score Distribution
            const distribution: ScoreDistribution[] = Array.from({length: 10}, (_, i) => ({
                range: `${i*10}-${i*10+10}%`,
                count: 0,
            }));

            submissions.forEach(sub => {
                const score = sub.percentage;
                const rangeIndex = Math.floor(score / 10);
                if (distribution[rangeIndex]) {
                    distribution[rangeIndex].count++;
                }
            });
            setScoreDistribution(distribution);


        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
        }
    };


    if (!user) {
        return (
           <div className="flex h-screen w-full items-center justify-center">
               <p>Loading...</p>
           </div>
       );
    }
    
    return (
        <div className="container mx-auto py-8 space-y-8">
             <div className="mb-4">
                <Link href="/admin/exams">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exams List
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Exam Analytics</CardTitle>
                    <CardDescription>
                        Performance breakdown for the exam: "{exam?.title || 'Loading...'}"
                    </CardDescription>
                </CardHeader>
            </Card>

            {loading ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            ) : analytics.length > 0 ? (
                <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Performance Chart</CardTitle>
                            <CardDescription>Correct vs. Incorrect answers for each question, sorted by most incorrect.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={analytics}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis 
                                        type="category" 
                                        dataKey="questionText" 
                                        width={150}
                                        tick={{ fontSize: 12, width: 150 }}
                                        tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [value, name === 'correct' ? 'Correct' : 'Incorrect']}
                                        labelFormatter={(label) => label.length > 50 ? `${label.substring(0, 50)}...` : label}
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="correct" stackId="a" fill="hsl(var(--chart-1))" name="Correct" />
                                    <Bar dataKey="incorrect" stackId="a" fill="hsl(var(--chart-2))" name="Incorrect" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Student Score Distribution</CardTitle>
                            <CardDescription>Number of students who scored in each percentage range.</CardDescription>
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
                            <CardTitle>Question Detailed Breakdown</CardTitle>
                            <CardDescription>Table view of correct and incorrect responses per question.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60%]">Question</TableHead>
                                        <TableHead className="text-center">Correct</TableHead>
                                        <TableHead className="text-center">Incorrect</TableHead>
                                        <TableHead className="text-center">Success Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.map((q) => (
                                        <TableRow key={q.questionId}>
                                            <TableCell className="font-medium text-sm">{q.questionText}</TableCell>
                                            <TableCell className="text-center text-green-600 font-bold">
                                                <div className="flex items-center justify-center gap-2">
                                                    <CheckCircle className="h-4 w-4" /> 
                                                    <span>{q.correct}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-destructive font-bold">
                                                <div className="flex items-center justify-center gap-2">
                                                    <XCircle className="h-4 w-4" /> 
                                                    <span>{q.incorrect}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {q.total > 0 ? `${Math.round((q.correct / q.total) * 100)}%` : 'N/A'}
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
                            <CardDescription>List of all students who completed this exam, sorted by score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="text-center">Score</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentSubmissions.map((sub) => (
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
                                            <TableCell className="text-center font-semibold">{sub.percentage}%</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={sub.percentage >= (exam?.passPercentage ?? 50) ? 'default' : 'destructive'}>
                                                    {sub.percentage >= (exam?.passPercentage ?? 50) ? 'Passed' : 'Failed'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                </>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No submissions found for this exam yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

