import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_EXAMS } from "@/lib/mock-data";
import { Clock, FileText, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Welcome Back, User!</h1>
          <p className="text-muted-foreground mt-2">Here are your available exams. Good luck!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_EXAMS.map((exam) => (
            <div key={exam.id} className="flip-card h-[280px]">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                   <Card className="flex flex-col h-full">
                    <CardHeader>
                      <CardTitle className="font-headline text-xl">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                       <div className="flex items-center text-sm text-muted-foreground">
                         <FileText className="mr-2 h-4 w-4" />
                         <span>{exam.questionCount} Questions</span>
                       </div>
                       <div className="flex items-center text-sm text-muted-foreground">
                         <Clock className="mr-2 h-4 w-4" />
                         <span>{exam.duration} Minutes</span>
                       </div>
                    </CardContent>
                     <CardFooter>
                        <div className="text-sm text-primary font-semibold">Hover to see details</div>
                     </CardFooter>
                  </Card>
                </div>
                <div className="flip-card-back">
                   <Card className="flex flex-col h-full bg-secondary">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl">{exam.title}</CardTitle>
                        <CardDescription className="text-secondary-foreground/80">{exam.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow" />
                      <CardFooter>
                        <Link href={`/test/${exam.id}`} className="w-full">
                          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105">
                            Start Test <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
