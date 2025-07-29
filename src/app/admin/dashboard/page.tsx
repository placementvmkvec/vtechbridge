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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { ClipboardList, Users, CheckCircle } from "lucide-react";

const chartData = [
  { exam: "Mid-Term", passed: 0, failed: 0 },
  { exam: "Final", passed: 0, failed: 0 },
  { exam: "Quiz 1", passed: 0, failed: 0 },
  { exam: "Advanced JS", passed: 0, failed: 0 },
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
    { name: 'Passed', value: 0, color: 'hsl(var(--chart-1))' },
    { name: 'Failed', value: 0, color: 'hsl(var(--chart-2))' },
];

export default function AdminDashboardPage() {
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
              <p className="text-xs text-muted-foreground">
                Active exams available to users
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Submissions Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from yesterday
              </p>
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
      </main>
    </div>
  );
}
