
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { ClipboardList, Users, CheckCircle, Upload } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createExamFromQuestions } from '@/ai/flows/create-exam-flow';
import type { CreateExamInput } from '@/ai/flows/types';

const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

const chartData: any[] = [];
const chartConfig = {
  passed: { label: "Passed", color: "hsl(var(--chart-1))" },
  failed: { label: "Failed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;
const pieChartData: any[] = [];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email !== ADMIN_EMAIL) {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleCreateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreatingExam(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = Number(formData.get('duration'));
    const file = formData.get('questions-file') as File;

    if (!file) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a question file.' });
      setIsCreatingExam(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const fileData = (event.target.result as string).split(',')[1];
          const input: CreateExamInput = { title, description, duration, fileData };
          const result = await createExamFromQuestions(input);
          toast({ title: 'Success!', description: result.message });
          e.currentTarget.reset();
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({ variant: 'destructive', title: 'Exam Creation Failed', description: error.message });
    } finally {
      setIsCreatingExam(false);
    }
  };
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-secondary">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Active exams available to users</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% from yesterday</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Upload className="h-5 w-5" /> Create New Exam</CardTitle>
              <CardDescription>Upload an Excel file with questions to create a new exam.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input id="title" name="title" required placeholder="e.g., Mid-term Examination" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="A short description of the exam." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (in minutes)</Label>
                  <Input id="duration" name="duration" type="number" required placeholder="e.g., 60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questions-file">Questions File (.xlsx)</Label>
                  <Input id="questions-file" name="questions-file" type="file" required accept=".xlsx" />
                   <p className="text-xs text-muted-foreground">
                    Excel columns: Question, Option A, Option B, Option C, Option D, Correct Answer
                  </p>
                </div>
                <Button type="submit" disabled={isCreatingExam}>
                  {isCreatingExam ? 'Creating Exam...' : 'Create Exam'}
                </Button>
              </form>
            </CardContent>
          </Card>
           <Card className="shadow-sm">
                 <CardHeader>
                    <CardTitle className="font-headline">Recent Submissions</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="hidden md:table-cell">Exam</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No recent submissions.</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                 </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Pass/Fail Rate Overview</CardTitle>
              <CardDescription>A look at pass vs fail rates across all exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Exam Performance</CardTitle>
              <CardDescription>Comparison of pass/fail counts for different exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="exam" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 10)} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="passed" fill="var(--color-passed)" radius={4} />
                  <Bar dataKey="failed" fill="var(--color-failed)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
