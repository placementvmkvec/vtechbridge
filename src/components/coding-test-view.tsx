
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
import { Label } from './ui/label';

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
    isPublic?: boolean;
    passed: boolean;
    output: string;
    expected?: string;
    error?: string;
    input: string;
};

export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState<EvaluationResult | null>(null);

  const [publicTestRunResults, setPublicTestRunResults] = useState<EvaluationResult[]>([]);
  const [submissionResults, setSubmissionResults] = useState<EvaluationResult[]>([]);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';

  const executeCode = async (testCases: {input: string, output: string}[], isPrivateRun: boolean) => {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: problem.language,
        testCases: testCases,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Create a synthetic error result for all test cases
        const errorResults = testCases.map((tc, index) => ({
             testCaseIndex: index,
             isPublic: !isPrivateRun,
             passed: false,
             output: `API Error: ${errorText}`,
             expected: tc.output,
             error: `API Error: ${response.statusText}`,
             input: tc.input,
        }));

        if (isPrivateRun) {
            setSubmissionResults(errorResults);
        } else {
            setPublicTestRunResults(errorResults);
        }
        return;
    }
    
    return response.json();
  }

  const handleRunPublicTests = async () => {
    setIsRunning(true);
    setPublicTestRunResults([]);
    const results = await executeCode(problem.publicTestCases, false);
    setPublicTestRunResults(results || []);
    setIsRunning(false);
  }

  const handleRunCustom = async () => {
      setIsRunning(true);
      setRunResult(null);

      const result = await executeCode([{input: customInput, output: ''}], false);
      if (result && result.length > 0) {
        setRunResult({ ...result[0], passed: false, isPublic: false });
      } else {
        setRunResult({ passed: false, input: customInput, output: "Execution failed or produced no output.", error: "Execution failed"});
      }

      setIsRunning(false);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionResults([]);
    setTotalScore(null);

    const results = await executeCode(problem.privateTestCases, true);
    if (results) {
        setSubmissionResults(results);
        const passedCount = results.filter((r: EvaluationResult) => r.passed).length;
        setTotalScore(passedCount * problem.pointsPerCase);
    }
    
    setIsSubmitting(false);
  };

  const isLoading = isRunning || isSubmitting;

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-secondary">
        <header className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm">
            <h1 className="text-xl font-bold font-headline">{problem.title}</h1>
            <div className="flex items-center gap-2">
                 <Button onClick={handleRunPublicTests} disabled={isLoading} variant="outline">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Running...' : 'Run Public Tests'}
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
                    <Tabs defaultValue="results">
                         <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="results">Test Results</TabsTrigger>
                            <TabsTrigger value="custom">Custom Input</TabsTrigger>
                        </TabsList>

                        <TabsContent value="results" className="p-4 space-y-4">
                            {publicTestRunResults.length > 0 ? (
                                publicTestRunResults.map((result, index) => (
                                    <Alert key={index} variant={result.passed ? 'default' : 'destructive'}>
                                        <AlertTitle className="flex items-center gap-2">
                                            {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            Public Test Case #{index + 1} - {result.passed ? 'Passed' : 'Failed'}
                                        </AlertTitle>
                                        {!result.passed && (
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
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground p-4">
                                    Click "Run Public Tests" to see the results here.
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="custom" className="p-4 space-y-4">
                            <div>
                                <Label htmlFor="custom-input" className="mb-2 block">Custom Input</Label>
                                <Textarea id="custom-input" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter your test input here..." rows={3} />
                                <Button onClick={handleRunCustom} disabled={isLoading} variant="secondary" size="sm" className="mt-2">
                                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                    Run Custom Input
                                </Button>
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
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    </div>
  );
}

    

    