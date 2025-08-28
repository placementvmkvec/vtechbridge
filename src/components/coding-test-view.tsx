
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
import { useToast } from '@/hooks/use-toast';
import { evaluateCode } from '@/ai/flows/evaluate-code-flow';
import type { CodeEvaluationOutput } from '@/ai/schemas/code-evaluation-schemas';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { useTheme } from 'next-themes';

type Props = {
  problem: CodingProblem;
};

// Mapping from our language names to Ace editor mode names
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
}

export function CodingTestView({ problem }: Props) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<CodeEvaluationOutput | null>(null);
  
  const editorTheme = theme === 'dark' ? 'monokai' : 'github';
  const languageMode = languageModeMap[problem.language] || 'javascript';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setEvaluationResult(null);
    try {
      const result = await evaluateCode({
        problemStatement: problem.problemStatement,
        userCode: code,
        language: problem.language,
        testCases: problem.testCases,
      });
      setEvaluationResult(result);
      toast({
        title: 'Evaluation Complete',
        description: `Your code passed ${result.testCasesPassed} out of ${result.totalTestCases} test cases.`,
      });
    } catch (error) {
      console.error('Error evaluating code:', error);
      toast({
        variant: 'destructive',
        title: 'Evaluation Failed',
        description: 'An unexpected error occurred while evaluating your code.',
      });
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Problem Statement</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="prose dark:prose-invert max-w-full p-2">
                           <Markdown>{problem.problemStatement}</Markdown>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Code Editor</CardTitle>
                        <CardDescription>Language: {problem.language}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
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
                {evaluationResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Evaluation Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                {evaluationResult.testCasesPassed === evaluationResult.totalTestCases ? (
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-10 w-10 text-destructive" />
                                )}
                                <div>
                                    <p className="font-bold text-lg">
                                        {evaluationResult.testCasesPassed} / {evaluationResult.totalTestCases} Test Cases Passed
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold">Feedback:</h4>
                                <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{evaluationResult.feedback}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}

