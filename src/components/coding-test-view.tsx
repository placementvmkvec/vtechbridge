
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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


export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);

  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';
  
  const executeCode = async (testCases: TestCase[], isPublicSet: boolean): Promise<EvaluationResult[]> => {
    const languageVersion = languageVersionMap[problem.language];
    if (!languageVersion) {
        return testCases.map((tc, index) => ({
             testCaseIndex: index,
             isPublic: isPublicSet,
             passed: false,
             output: `Language ${problem.language} is not supported.`,
             expected: tc.output,
             error: `Unsupported Language`,
             input: tc.input,
        }));
    }
    
    const promises = testCases.map((tc, index) => fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            language: problem.language,
            version: languageVersion,
            files: [{ content: code }],
            stdin: tc.input,
        }),
    }).then(res => res.json()).then(data => {
        const output = data.run?.stdout?.trim() || data.run?.stderr || 'No output';
        const error = data.run?.stderr;
        return {
            testCaseIndex: index,
            isPublic: isPublicSet,
            passed: !error && output === tc.output,
            output: output,
            expected: tc.output,
            error: error,
            input: tc.input,
        };
    }).catch(err => {
         return {
            testCaseIndex: index,
            isPublic: isPublicSet,
            passed: false,
            output: `API Error: ${err.message}`,
            expected: tc.output,
            error: `API Error`,
            input: tc.input,
        };
    }));

    return Promise.all(promises);
  }

  const handleRunCode = async () => {
      setIsRunning(true);
      setRunCompleted(false);
      setEvaluationResults([]);
      setTotalScore(null);
      
      const allTestCases = [
        ...problem.publicTestCases.map(tc => ({...tc, isPublic: true})),
        ...problem.privateTestCases.map(tc => ({...tc, isPublic: false})),
      ];

      const promises = allTestCases.map(tc => fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              language: problem.language,
              version: languageVersionMap[problem.language],
              files: [{ content: code }],
              stdin: tc.input,
          }),
      }).then(res => res.json()).then(data => {
          const output = data.run?.stdout?.trim() || data.run?.stderr || 'No output';
          const error = data.run?.stderr;
          return {
              ...tc, // includes input, output (expected), isPublic
              passed: !error && output === tc.output,
              actualOutput: output,
              error: error,
          };
      }));

      const results = await Promise.all(promises);
      const formattedResults = results.map((result, index) => ({
          testCaseIndex: index,
          isPublic: result.isPublic,
          passed: result.passed,
          output: result.actualOutput,
          expected: result.output,
          error: result.error,
          input: result.input,
      }))
      
      setEvaluationResults(formattedResults);
      setIsRunning(false);
      setRunCompleted(true);
  }

  const handleSubmit = async () => {
    if (!runCompleted) {
        alert("Please run your code at least once before submitting.");
        return;
    }
    setIsSubmitting(true);

    const passedPrivateCount = evaluationResults.filter((r) => !r.isPublic && r.passed).length;
    const finalScore = passedPrivateCount * problem.pointsPerCase;
    setTotalScore(finalScore);

    // Simulate API call to save score
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // You would likely redirect to a results page here
    // For now, we just show an alert and lock the submit button
    alert(`Final score of ${finalScore} submitted!`);
    // isSubmitting will remain true to prevent resubmission
  };

  const isLoading = isRunning; // only consider running state for loading, not submitting

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-secondary">
        <header className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm">
            <h1 className="text-xl font-bold font-headline">{problem.title}</h1>
            <div className="flex items-center gap-2">
                 <Button onClick={handleRunCode} disabled={isLoading || isSubmitting} variant="secondary">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Running...' : 'Run Code'}
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || !runCompleted || isSubmitting}>
                    {isSubmitting ? 'Submitted' : <Shield className="mr-2 h-4 w-4" />}
                    {isSubmitting ? `Score: ${totalScore}` : 'Submit Final Code'}
                </Button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="flex flex-col gap-4">
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
                            These are the examples your code will be tested against before final submission.
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
                
                 <Card className="max-h-[350px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>Results from your latest run will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-y-auto flex-1">
                        {isRunning && (
                            <div className="flex items-center justify-center p-8 gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Evaluating your code...</span>
                            </div>
                        )}
                        {!isRunning && evaluationResults.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground p-4">
                                Click "Run Code" to test your solution.
                            </div>
                        )}
                        {!isRunning && evaluationResults.length > 0 && (
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-2">
                                {evaluationResults.map((result) => (
                                    <Alert key={`${result.isPublic}-${result.testCaseIndex}`} variant={result.passed ? 'default' : 'destructive'}>
                                        <AlertTitle className="flex items-center gap-2">
                                            {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            <span>
                                                {result.isPublic ? `Public Test Case #${result.testCaseIndex + 1}` : `Private Test Case #${result.testCaseIndex - problem.publicTestCases.length + 1}`} - 
                                                <span className="font-bold">{result.passed ? 'Passed' : 'Failed'}</span>
                                            </span>
                                        </AlertTitle>
                                        {!result.passed && result.isPublic && (
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
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                         {!isRunning && totalScore !== null && (
                            <Alert variant="default" className="mt-4 bg-primary/10">
                                <AlertTitle className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary"/> Final Submission Results
                                </AlertTitle>
                                <AlertDescription>
                                    Your final score is <span className="font-bold">{totalScore}</span>. You can now safely leave this page.
                                </AlertDescription>
                            </Alert>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
