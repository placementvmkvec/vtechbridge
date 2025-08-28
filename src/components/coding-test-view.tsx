
'use client';

import { useState } from 'react';
import type { CodingProblem, TestCase } from '@/app/coding/[id]/page';
import AceEditor from 'react-ace';
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

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Play, Shield, Unlock, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from './ui/textarea';

type Props = {
  problem: CodingProblem;
};

const languageModeMap: Record<string, string> = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'csharp': 'csharp',
    'cpp': 'c_cpp',
    'c': 'c_cpp',
    'typescript': 'typescript',
    'go': 'golang',
    'rust': 'rust',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'php': 'php',
};

type EvaluationResult = {
    testCaseIndex?: number;
    passed: boolean;
    output: string;
    expected?: string;
    error?: string;
    input: string;
};

// Map our language names to the version/name the new API expects
const languageVersionMap: { [key: string]: string } = {
    'javascript': 'javascript',
    'python': 'python3',
    'java': 'java',
    'csharp': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'typescript': 'typescript',
    'go': 'go',
    'rust': 'rust',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'php': 'php',
};


export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState<EvaluationResult | null>(null);

  const [submissionResults, setSubmissionResults] = useState<EvaluationResult[]>([]);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';

  const executeCode = async (codeToRun: string, input: string): Promise<Omit<EvaluationResult, 'passed' | 'expected' | 'testCaseIndex'>> => {
     try {
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: languageVersionMap[problem.language] || 'javascript',
                    version: '*',
                    files: [{ content: codeToRun }],
                    stdin: input,
                }),
            });
            
            const result = await response.json();
            
            if (result.run && result.run.code === 0) {
                return { output: result.run.stdout.trim(), error: result.run.stderr || undefined, input };
            } else {
                const errorOutput = result.run?.stderr || result.compile?.stderr || result.message || 'An unknown execution error occurred.';
                return { output: errorOutput, error: errorOutput, input };
            }
        } catch (error: any) {
            return { output: "API Communication Error", error: "Failed to connect to the execution service.", input };
        }
  }

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunResult(null);

    const result = await executeCode(code, customInput);
    setRunResult({ ...result, passed: false }); // 'passed' is irrelevant for custom runs

    setIsRunning(false);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionResults([]);
    setTotalScore(null);

    const results: EvaluationResult[] = [];
    let passedCount = 0;

    for (let i = 0; i < problem.privateTestCases.length; i++) {
        const testCase = problem.privateTestCases[i];
        const execResult = await executeCode(code, testCase.input);

        const passed = !execResult.error && execResult.output === testCase.output.trim();
        if (passed) {
            passedCount++;
        }

        results.push({
            testCaseIndex: i,
            passed,
            output: execResult.output,
            expected: testCase.output,
            error: execResult.error,
            input: testCase.input
        });
        
        // Update results progressively
        setSubmissionResults([...results]);
    }
    
    setTotalScore(passedCount * problem.pointsPerCase);
    setIsSubmitting(false);
  };

  const isLoading = isRunning || isSubmitting;

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-secondary">
        <header className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm">
            <h1 className="text-xl font-bold font-headline">{problem.title}</h1>
            <div className="flex items-center gap-2">
                 <Button onClick={handleRunCode} disabled={isLoading} variant="outline">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Running...' : 'Run Code'}
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Submitting...' : 'Submit Final Code'}
                </Button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Problem Statement</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="prose dark:prose-invert max-w-full p-2">
                           <Markdown>{problem.problemStatement}</Markdown>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-4 min-h-0">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Code Editor</CardTitle>
                        <CardDescription>Language: {problem.language}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 relative">
                        <AceEditor
                            mode={languageMode}
                            theme={editorTheme}
                            onChange={setCode}
                            name="code-editor"
                            editorProps={{ $blockScrolling: true }}
                            value={code}
                            fontSize={16}
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0"
                            setOptions={{
                                useWorker: false,
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: true,
                                tabSize: 2,
                            }}
                        />
                    </CardContent>
                </Card>
                
                <Card className="max-h-[300px] overflow-y-auto">
                    <Tabs defaultValue="run">
                         <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="run">Run / Debug</TabsTrigger>
                            <TabsTrigger value="submit">Submission Result</TabsTrigger>
                        </TabsList>
                        <TabsContent value="run" className="p-4 space-y-4">
                            <div>
                                <Label htmlFor="custom-input" className="mb-2 block">Custom Input</Label>
                                <Textarea id="custom-input" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter your test input here..." rows={3} />
                            </div>
                            {runResult && (
                                 <div>
                                    <Label className="mb-2 block">Output</Label>
                                    <Alert variant={runResult.error ? 'destructive' : 'default'}>
                                        <AlertTitle className="flex items-center gap-2">
                                            {runResult.error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            {runResult.error ? 'Execution Error' : 'Execution Success'}
                                        </AlertTitle>
                                        <AlertDescription asChild>
                                            <pre className="mt-2 font-mono text-xs whitespace-pre-wrap">{runResult.output}</pre>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                            {problem.publicTestCases?.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2"><Unlock className="h-4 w-4" /> Public Test Cases</h4>
                                    {problem.publicTestCases.map((tc, index) => (
                                        <div key={index} className="text-xs font-mono p-2 border rounded bg-muted/50">
                                            <p><b>Input:</b> {tc.input}</p>
                                            <p><b>Expected Output:</b> {tc.output}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                         <TabsContent value="submit" className="p-4 space-y-4">
                            {totalScore !== null && (
                                <Card className="bg-primary/10 border-primary">
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-2xl">Final Score: {totalScore} / {problem.privateTestCases.length * problem.pointsPerCase}</CardTitle>
                                    </CardHeader>
                                </Card>
                            )}
                             {submissionResults.map((result, index) => (
                                <Alert key={index} variant={result.passed ? 'default' : 'destructive'}>
                                    <AlertTitle className="flex items-center gap-2">
                                        {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        Private Test Case #{index + 1} - {result.passed ? 'Passed' : 'Failed'}
                                    </AlertTitle>
                                    {!result.passed && (
                                         <AlertDescription className="mt-2 font-mono text-xs">
                                           <p><b>Expected:</b> {result.expected}</p>
                                           <p><b>Your Output:</b> {result.output}</p>
                                           {result.error && <p className="mt-1"><b>Error:</b> {result.error}</p>}
                                         </AlertDescription>
                                    )}
                                </Alert>
                            ))}
                            {isSubmitting && submissionResults.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground p-4">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    <p>Running against private test cases...</p>
                                </div>
                            )}
                             {submissionResults.length === 0 && !isSubmitting && (
                                <div className="text-center text-sm text-muted-foreground p-4">
                                    Your submission results will appear here.
                                </div>
                             )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    </div>
  );
}
