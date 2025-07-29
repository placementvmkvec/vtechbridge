
import { doc, getDoc, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Question = {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
};

type Submission = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    examId: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: Timestamp;
    answers: Record<string, string>;
};

type Exam = {
    id: string;
    title: string;
    passPercentage: number;
    questionSets: Record<string, Question[]>;
};

async function getSubmissionDetails(submissionId: string) {
    const submissionDocRef = doc(db, "submissions", submissionId);
    const submissionDoc = await getDoc(submissionDocRef);

    if (!submissionDoc.exists()) {
        return null;
    }

    const submissionData = submissionDoc.data() as Submission;
    
    const examDocRef = doc(db, "exams", submissionData.examId);
    const examDoc = await getDoc(examDocRef);

    if (!examDoc.exists()) {
        return { submission: submissionData, exam: null, questions: [] };
    }

    const examData = examDoc.data() as Exam;
    
    // Find which question set the user took by matching question IDs from answers
    let userQuestions: Question[] = [];
    const answerKeys = Object.keys(submissionData.answers);
    if(answerKeys.length > 0) {
        const firstQuestionId = answerKeys[0];
        for (const setKey in examData.questionSets) {
            const questionExistsInSet = examData.questionSets[setKey].some(q => q.id === firstQuestionId);
            if (questionExistsInSet) {
                userQuestions = examData.questionSets[setKey];
                break;
            }
        }
    }


    return {
        submission: submissionData,
        exam: examData,
        questions: userQuestions,
    };
}


export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
    const details = await getSubmissionDetails(params.id);

    if (!details || !details.submission) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Submission not found.</p>
            </div>
        );
    }

    const { submission, exam, questions } = details;
    const passPercentage = exam?.passPercentage ?? 50;
    const isPassed = submission.percentage >= passPercentage;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-4">
                <Link href={`/admin/submissions?examId=${submission.examId}`}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Submissions
                    </Button>
                </Link>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Submission Details</CardTitle>
                    <CardDescription>
                        Analytics for the test taken by {submission.userName} for the exam "{submission.examTitle}".
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <Avatar className="h-16 w-16 border">
                            <AvatarImage src={`https://placehold.co/100x100.png`} alt={submission.userName} data-ai-hint="user avatar" />
                            <AvatarFallback>{submission.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-semibold">{submission.userName}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-semibold">{submission.userEmail}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Exam</p>
                                <p className="font-semibold">{submission.examTitle}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground">Score</p>
                                <p className="font-semibold">{submission.score}/{submission.totalQuestions}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground">Percentage</p>
                                <Badge variant={isPassed ? 'default' : 'destructive'}>{submission.percentage}%</Badge>
                            </div>
                             <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-semibold">{isPassed ? 'Passed' : 'Failed'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Question Breakdown</CardTitle>
                    <CardDescription>Review of each answer submitted by the user.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {questions.length > 0 ? (
                            questions.map((q, index) => {
                                const userAnswer = submission.answers[q.id];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                    <div key={q.id}>
                                        <div className="flex items-start justify-between">
                                            <p className="font-semibold">{index + 1}. {q.question}</p>
                                            {isCorrect ? (
                                                <Check className="h-5 w-5 text-green-600 shrink-0" />
                                            ) : (
                                                <X className="h-5 w-5 text-destructive shrink-0" />
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-2 pl-4">
                                             <p className={`text-sm ${isCorrect ? 'text-muted-foreground' : 'text-destructive font-semibold'}`}>
                                                Your Answer: {userAnswer || <span className="italic">Not answered</span>}
                                             </p>
                                             {!isCorrect && (
                                                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                                                   Correct Answer: {q.correctAnswer}
                                                </p>
                                             )}
                                        </div>
                                        {index < questions.length - 1 && <Separator className="mt-6" />}
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                Could not load the questions for this exam. The exam structure may have changed.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
