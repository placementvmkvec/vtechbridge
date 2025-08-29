
'use client'

import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CheckCircle, Code, Shield, Unlock, XCircle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AceEditor from 'react-ace';
import { useTheme } from 'next-themes';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-rust';
import 'ace-builds/src-noconflict/mode-swift';
import 'ace-builds/src-noconflict/mode-kotlin';
import 'ace-builds/src-noconflict/mode-php';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


type EvaluationResult = {
    testCaseIndex: number;
    isPublic: boolean;
    passed: boolean;
    output: string;
    expected: string;
    error?: string;
    input: string;
};

type CodingSubmission = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    problemId: string;
    problemTitle: string;
    language: string;
    code: string;
    score: number;
    results: EvaluationResult[];
    createdAt: Timestamp;
};

const languageModeMap: Record<string, string> = {
    'javascript': 'javascript', 'python': 'python', 'java': 'java',
    'csharp': 'csharp', 'cpp': 'c_cpp', 'c': 'c_cpp', 'typescript': 'typescript',
    'go': 'golang', 'rust': 'rust', 'swift': 'swift', 'kotlin': 'kotlin', 'php': 'php',
};

async function getSubmissionDetails(submissionId: string) {
    const submissionDocRef = doc(db, "coding_submissions", submissionId);
    const submissionDoc = await getDoc(submissionDocRef);

    if (!submissionDoc.exists()) {
        return null;
    }
    return { id: submissionDoc.id, ...submissionDoc.data() } as CodingSubmission;
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
    const [submission, setSubmission] = useState<CodingSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const details = await getSubmissionDetails(params.id);
            setSubmission(details);
            setLoading(false);
        };
        fetchDetails();
    }, [params.id]);


    if (loading) {
        return (
             <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        )
    }

    if (!submission) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Submission not found.</p>
            </div>
        );
    }
    
    const editorTheme = theme === 'dark' ? 'monokai' : 'github';
    const languageMode = languageModeMap[submission.language] || 'javascript';

    return (
        <div className="container mx-auto py-8">
            <div className="mb-4">
                <Link href={`/admin/coding-submissions`}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Submissions
                    </Button>
                </Link>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Coding Submission Details</CardTitle>
                    <CardDescription>
                        Analysis for the attempt by {submission.userName} on "{submission.problemTitle}".
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
                                <p className="text-muted-foreground">Problem</p>
                                <p className="font-semibold">{submission.problemTitle}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground">Language</p>
                                <Badge variant="secondary">{submission.language}</Badge>
                            </div>
                             <div>
                                <p className="text-muted-foreground">Score</p>
                                <p className="font-bold text-lg text-primary">{submission.score}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Submitted Code</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[500px] relative">
                         <AceEditor
                            mode={languageMode}
                            theme={editorTheme}
                            name="submitted-code-editor"
                            editorProps={{ $blockScrolling: true }}
                            value={submission.code}
                            fontSize={14}
                            width="100%"
                            height="100%"
                            readOnly
                            className="absolute top-0 left-0"
                            setOptions={{ useWorker: false, showLineNumbers: true, tabSize: 2 }}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Test Case Results</CardTitle>
                        <CardDescription>Breakdown of passed and failed test cases.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2"><Unlock className="h-4 w-4"/>Public Cases</h3>
                            {submission.results.filter(r => r.isPublic).map((result, i) => (
                                <Alert key={`pub-${i}`} variant={result.passed ? 'default' : 'destructive'}>
                                    <AlertTitle className="flex items-center gap-2">
                                        {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        <span>Test Case #{result.testCaseIndex + 1} - <span className="font-bold">{result.passed ? 'Passed' : 'Failed'}</span></span>
                                    </AlertTitle>
                                </Alert>
                            ))}
                        </div>
                        <Separator />
                         <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4"/>Private Cases</h3>
                             {submission.results.filter(r => !r.isPublic).map((result, i) => (
                                <Alert key={`priv-${i}`} variant={result.passed ? 'default' : 'destructive'}>
                                    <AlertTitle className="flex items-center gap-2">
                                        {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        <span>Test Case #{result.testCaseIndex + 1} - <span className="font-bold">{result.passed ? 'Passed' : 'Failed'}</span></span>
                                    </AlertTitle>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
