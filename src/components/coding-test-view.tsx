
'use client';

import { useState } from 'react';
import type { CodingProblem } from '@/app/coding/[id]/page';
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
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

type LanguageIdMap = {
    [key: string]: number;
};

const languageIdMap: LanguageIdMap = {
    'javascript': 93, // Judge0 ID for JavaScript (Node.js)
    'python': 71, // Judge0 ID for Python 3.8.1
    'java': 62, // Judge0 ID for Java (OpenJDK 13.0.1)
    'csharp': 51, // Judge- ID for C# (Mono 6.6.0.161)
    'cpp': 54, // Judge0 ID for C++ (GCC 9.2.0)
    'c': 50, // Judge0 ID for C (GCC 9.2.0)
    'typescript': 74, // Judge0 ID for TypeScript (3.7.4)
    'go': 60, // Judge0 ID for Go (1.13.5)
    'rust': 73, // Judge0 ID for Rust (1.40.0)
    'swift': 83, // Judge0 ID for Swift (5.2.3)
    'kotlin': 78, // Judge0 ID for Kotlin (1.3.70)
    'php': 68, // Judge0 ID for PHP (7.4.1)
};

type EvaluationResult = {
    testCaseIndex: number;
    passed: boolean;
    output: string;
    expected: string;
    error?: string;
};

export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setEvaluationResults([]);

    const languageId = languageIdMap[problem.language];
    if (!languageId) {
        alert("Selected language is not supported by the compiler.");
        setIsSubmitting(false);
        return;
    }
    
    const results: EvaluationResult[] = [];

    for (let i = 0; i < problem.testCases.length; i++) {
        const testCase = problem.testCases[i];
        try {
            const response = await fetch('/api/run-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language_id: languageId,
                    source_code: code,
                    stdin: testCase.input,
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                const errorMessage = result.error || (result.details ? JSON.stringify(result.details) : 'Failed to execute code.');
                throw new Error(errorMessage);
            }

            let output = '';
            let hasError = false;
            let errorMessage = '';

            if (result.status?.id === 3) { // Status 3 is "Accepted"
                output = result.stdout ? result.stdout.trim() : '';
            } else { // Any other status is considered an error (Compile Error, Runtime Error, etc.)
                hasError = true;
                errorMessage = result.stderr || result.compile_output || `Execution failed with status: ${result.status?.description}`;
                output = errorMessage;
            }
            
            const passed = !hasError && output === testCase.output.trim();
            results.push({
                testCaseIndex: i,
                passed,
                output,
                expected: testCase.output,
                error: hasError ? errorMessage : undefined,
            });

        } catch (error: any) {
            results.push({
                testCaseIndex: i,
                passed: false,
                output: "Execution Error",
                expected: testCase.output,
                error: error.message
            });
        }
        // Update results after each test case
        setEvaluationResults([...results]);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-screen p-4 gap-4 bg-secondary">
        <header className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm">
            <h1 className="text-xl font-bold font-headline">{problem.title}</h1>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Evaluating...' : 'Submit Code'}
            </Button>
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
                
                {evaluationResults.length > 0 && (
                    <Card className="max-h-[250px] overflow-y-auto">
                        <CardHeader>
                             <CardTitle>Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="testcase-0">
                                <TabsList>
                                     {evaluationResults.map((result, index) => (
                                        <TabsTrigger key={index} value={`testcase-${index}`}>
                                            Test Case {index + 1}
                                            {result.passed ? <CheckCircle className="h-4 w-4 ml-2 text-green-500"/> : <XCircle className="h-4 w-4 ml-2 text-destructive"/>}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {evaluationResults.map((result, index) => (
                                    <TabsContent key={index} value={`testcase-${index}`}>
                                        <Alert variant={result.passed ? 'default' : 'destructive'}>
                                            <AlertTitle className="flex items-center gap-2">
                                                {result.passed ? <><CheckCircle className="h-4 w-4" /> Success</> : <><AlertCircle className="h-4 w-4" /> Failed</>}
                                            </AlertTitle>
                                            <AlertDescription className="mt-2 font-mono text-xs">
                                               <p><b>Input:</b> {problem.testCases[index].input}</p>
                                               <p><b>Expected Output:</b> {result.expected}</p>
                                               <p><b>Your Output:</b> {result.output}</p>
                                               {result.error && <p className="mt-2 text-destructive"><b>Error:</b> {result.error}</p>}
                                            </AlertDescription>
                                        </Alert>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
