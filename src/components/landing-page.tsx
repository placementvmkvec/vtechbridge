
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, BarChart, Users, Timer } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-transparent">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                  Online Examination Platform
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome to VTECHBRIDGE
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A seamless and secure platform for conducting online examinations. 
                  Manage tests, monitor users, and get detailed results with ease.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="shadow-lg transition-transform transform hover:scale-105">
                        Learn More
                    </Button>
                  </Link>
                </div>
              </div>
               <div className="relative">
                 <Image
                    src="https://placehold.co/600x400.png"
                    width="600"
                    height="400"
                    alt="Hero"
                    data-ai-hint="online exam concept"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last shadow-2xl"
                  />
                  <div className="absolute -bottom-8 -right-8 -z-10">
                     <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="hsl(var(--primary))" d="M49.2,-64.8C62.9,-54.6,72.7,-39.7,76.5,-23.1C80.3,-6.5,78.2,11.8,70.6,27.1C62.9,42.4,50,54.7,35.4,63.1C20.8,71.5,4.6,75.9,-11.5,74.3C-27.6,72.7,-43.6,65.1,-55.8,53C-68,40.9,-76.3,24.3,-77.8,7.3C-79.3,-9.7,-73.9,-27.1,-63.8,-41.2C-53.7,-55.3,-38.8,-66.1,-24.1,-71.4C-9.3,-76.7,5.2,-76.5,18.8,-72.8C32.4,-69.1,49.2,-64.8,49.2,-64.8Z" transform="translate(100 100)" />
                     </svg>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm text-primary font-semibold">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need for Online Testing
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with features designed to make online examinations fair, secure, and easy to manage.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">Admin Dashboard</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                  Manage exams, user data, and view insightful analytics all from one place.
                </CardContent>
              </Card>
               <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">Automated Question Chunking</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                  Automatically split question sets to ensure each user gets a unique set of questions.
                </CardContent>
              </Card>
               <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Timer className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">Real-Time Timer</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                  Enforce time limits with a real-time timer and automatic submission.
                </CardContent>
              </Card>
               <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <BarChart className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">Instant Results</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                  Users and admins can view detailed test results immediately after submission.
                </CardContent>
              </Card>
               <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">User Authentication</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                  Secure login for users to access their assigned tests and view their results.
                </CardContent>
              </Card>
                <Card className="grid gap-1 text-center p-6 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-primary/20 hover:border-primary">
                 <CardHeader className="flex justify-center items-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardTitle className="text-lg font-bold font-headline">Single Question Display</CardTitle>
                <CardContent className="text-sm text-muted-foreground">
                 Focus on one question at a time for a better testing experience.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 VTECHBRIDGE. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
