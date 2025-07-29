"use client";

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
import { MOCK_EXAMS, MOCK_USER_RESULTS } from "@/lib/mock-data";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { ClipboardList, Users, CheckCircle } from "lucide-react";

const chartData = [
  { exam: "Mid-Term", passed: 4000, failed: 2400 },
  { exam: "Final", passed: 3000, failed: 1398 },
  { exam: "Quiz 1", passed: 2000, failed: 9800 },
  { exam: "Advanced JS", passed: 2780, failed: 3908 },
];

const chartConfig = {
  passed: {
    label: "Passed",
    color: "hsl(var(--chart-1))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const pieChartData = [
    { name: 'Passed', value: 75, color: 'hsl(var(--chart-1))' },
    { name: 'Failed', value: 25, color: 'hsl(var(--chart-2))' },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_EXAMS.length}</div>
              <p className="text-xs text-muted-foreground">
                Active exams available to users
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Submissions Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_USER_RESULTS.length}</div>
              <p className="text-xs text-muted-foreground">
                +19% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="shadow-lg">
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
                                <Legend content={<ChartLegendContent />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                 <CardHeader>
                    <CardTitle className="font-headline">Exam Performance</CardTitle>
                     <CardDescription>Comparison of pass/fail counts for different exams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={chartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="exam"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 10)}
                            />
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
        <Card className="shadow-lg">
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
                {MOCK_USER_RESULTS.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="font-medium">{result.user}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {result.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {result.exam}
                    </TableCell>
                    <TableCell>
                      <Badge variant={parseInt(result.score) > 80 ? 'default' : 'destructive' } className={parseInt(result.score) > 80 ? 'bg-green-600' : ''}>
                        {result.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{result.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
