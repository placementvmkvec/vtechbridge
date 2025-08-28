
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
import { Loader2, Play, Shield, Unlock, CheckCircle, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type Props = {
  problem: CodingProblem;
};

const languageVersionMap: Record<string, string> = {
    javascript: "18.15.0",
    typescript: "5.0.3",
    python: "3.10.0",
    java: "15.0.2",
    csharp: "6.12.0",
    cpp: "10.2.0",
    c: "10.2.0",
    php: "8.2.3",
    go: "1.16.2",
    rust: "1.68.2",
    swift: "5.8",
    kotlin: "1.8.20",
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
    testCaseIndex: number;
    isPublic: boolean;
    passed: boolean;
    output: string;
    expected: string;
    error?: string;
    input: string;
};

type CustomRunResult = {
    output: string;
    error?: string;
    input: string;
}


export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  const [customInput, setCustomInput] = useState('');
  const [isCustomRunning, setIsCustomRunning] = useState(false);
  const [customRunResult, setCustomRunResult] = useState<CustomRunResult | null>(null);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';
  
 const executeCode = async (sourceCode: string, input: string) => {
    const languageVersion = languageVersionMap[problem.language];
     try {
         const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: problem.language,
                version: languageVersion,
                files: [{ content: sourceCode }],
                stdin: input,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API Error: ${errorText}`;
            if (response.status === 404) errorMessage = "The execution service endpoint was not found (404)."
            return {
                output: errorMessage,
                error: errorMessage,
            };
        }

        const data = await response.json();
        return {
            output: data.run?.stdout?.trim() || data.run?.stderr?.trim() || 'No output',
            error: data.run?.stderr,
        };
     } catch (err: any) {
         return {
            output: `Client Error: ${err.message}`,
            error: `Client-side fetch error`,
        };
     }
  }

  const handleRunCode = async () => {
    setIsRunning(true);
    setEvaluationResults([]);
    setTotalScore(null);
    
    const publicCases = problem.publicTestCases.map(tc => ({ ...tc, isPublic: true }));
    const privateCases = problem.privateTestCases.map(tc => ({ ...tc, isPublic: false }));
    const allTestCases = [...publicCases, ...privateCases];
    
    const results: EvaluationResult[] = [];
    for (let i = 0; i < allTestCases.length; i++) {
        const tc = allTestCases[i];
        const executionResult = await executeCode(code, tc.input);
        results.push({
            ...executionResult,
            passed: !executionResult.error && executionResult.output === tc.output,
            testCaseIndex: tc.isPublic ? i : i - publicCases.length,
            isPublic: tc.isPublic,
            expected: tc.output,
            input: tc.input
        });
    }
    
    setEvaluationResults(results);
    setIsRunning(false);
}


  const handleCustomRun = async () => {
    setIsCustomRunning(true);
    setCustomRunResult(null);
    const result = await executeCode(code, customInput);
    setCustomRunResult({ ...result, input: customInput });
    setIsCustomRunning(false);
  }

 const handleSubmit = async () => {
    if (evaluationResults.length === 0) {
        alert("Please run your code against the test cases at least once before submitting.");
        return;
    }
    setIsSubmitting(true);

    const passedPrivateCount = evaluationResults.filter((r) => !r.isPublic && r.passed).length;
    const finalScore = passedPrivateCount * problem.pointsPerCase;
    setTotalScore(finalScore);

    // Simulate API call to save score - in a real app, you would save this to Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would navigate away or show a proper success message.
    alert(`Final score of ${finalScore} submitted!`);
    // Example: router.push('/dashboard');
  };

  const isLoading = isRunning || isCustomRunning;

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-secondary">
        <header className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm">
            <h1 className="text-xl font-bold font-headline">{problem.title}</h1>
            <div className="flex items-center gap-2">
                 <Button onClick={handleRunCode} disabled={isLoading || isSubmitting} variant="secondary">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Running...' : 'Run Code'}
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || evaluationResults.length === 0 || isSubmitting}>
                    {isSubmitting ? 'Submitted' : <Shield className="mr-2 h-4 w-4" />}
                    {isSubmitting && totalScore !== null ? `Score: ${totalScore}` : 'Submit Final Code'}
                </Button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="flex flex-col gap-4 min-h-0">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Problem Statement</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <ScrollArea className="h-full pr-4">
                           <div className="prose dark:prose-invert max-w-full p-2">
                               <Markdown>{problem.problemStatement}</Markdown>
                           </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5" /> Public Test Cases
                        </CardTitle>
                        <CardDescription>
                            These are the examples your code will be tested against.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {problem.publicTestCases.map((tc, index) => (
                            <div key={index} className="p-4 bg-secondary rounded-lg font-mono text-sm">
                                <p className="font-semibold">Example #{index + 1}</p>
                                <p><span className="text-muted-foreground">Input:</span> {tc.input}</p>
                                <p><span className="text-muted-foreground">Expected Output:</span> {tc.output}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
             <div className="flex flex-col gap-4 min-h-0">
                <Card className="flex-grow flex flex-col">
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
                <Card className="h-1/3 flex flex-col">
                    <Tabs defaultValue="results" className="h-full flex flex-col">
                            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 self-start">
                            <TabsTrigger value="results">Test Results</TabsTrigger>
                            <TabsTrigger value="custom">Custom Input</TabsTrigger>
                        </TabsList>
                        <TabsContent value="results" className="flex-1 overflow-hidden p-4">
                                <ScrollArea className="h-full">
                                {isRunning && (
                                    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Evaluating your code...</span>
                                    </div>
                                )}
                                {!isRunning && evaluationResults.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                        Click "Run Code" to check your solution against test cases.
                                    </div>
                                )}
                                {!isRunning && evaluationResults.length > 0 && (
                                    <div className="space-y-2">
                                        {evaluationResults.map((result) => {
                                            const privateTestCaseNumber = evaluationResults.filter(r => !r.isPublic).findIndex(r => r.testCaseIndex === result.testCaseIndex);
                                            const testCaseNumber = result.isPublic ? result.testCaseIndex + 1 : privateTestCaseNumber + 1;

                                            return (
                                                <Alert key={`${result.isPublic}-${result.testCaseIndex}`} variant={result.passed ? 'default' : 'destructive'}>
                                                    <AlertTitle className="flex items-center gap-2">
                                                        {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                        <span>
                                                            {result.isPublic ? `Public Test Case #${testCaseNumber}` : `Private Test Case #${testCaseNumber}`} - 
                                                            <span className="font-bold">{result.passed ? 'Passed' : 'Failed'}</span>
                                                        </span>
                                                    </AlertTitle>
                                                    {result.isPublic && !result.passed && (
                                                        <AlertDescription asChild>
                                                            <div className="mt-2 font-mono text-xs space-y-1">
                                                                <p><b>Input:</b> {result.input}</p>
                                                                <p><b>Expected:</b> {result.expected}</p>
                                                                <p><b>Your Output:</b> {result.output}</p>
                                                                {result.error && <p className="mt-1"><b>Error:</b> {result.error}</p>}
                                                            </div>
                                                        </AlertDescription>
                                                    )}
                                                </Alert>
                                            )
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="custom" className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
                            <div className="flex-1 flex flex-col space-y-2">
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div className="flex flex-col space-y-2">
                                        <Label htmlFor="custom-input" className="mb-1">Custom Input (stdin)</Label>
                                        <Textarea id="custom-input" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter your test input here..." className="flex-1 font-mono text-sm" />
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <Label className="mb-1">Your Output</Label>
                                        <ScrollArea className="border rounded-md bg-secondary h-full">
                                            {isCustomRunning && (
                                                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                </div>
                                            )}
                                            {customRunResult && !isCustomRunning && (
                                                <div className="p-4 space-y-2 font-mono text-sm">
                                                    <pre><code>{customRunResult.output}</code></pre>
                                                        {customRunResult.error && (
                                                            <pre className="text-destructive"><code>{customRunResult.error}</code></pre>
                                                        )}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                                <Button onClick={handleCustomRun} disabled={isLoading || isSubmitting} className="self-start">
                                    {isCustomRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4"/>}
                                    {isCustomRunning ? 'Running...' : 'Run Custom Input'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    </div>
  );
}
