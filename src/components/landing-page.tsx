
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { ArrowRight, CheckCircle, BarChart, Users, Timer } from "lucide-react";
import Image from "next/image";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                  Online Examination Platform
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
                  Welcome to VTECHBRIDGE
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A seamless and secure platform for conducting online examinations. 
                  Manage tests, monitor users, and get detailed results with ease.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-8 text-sm font-medium text-accent-foreground shadow transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
               <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="online exam concept"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
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
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                 <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <Users className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">Admin Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Manage exams, user data, and view insightful analytics all from one place.
                </p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">Automated Question Chunking</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically split question sets to ensure each user gets a unique set of questions.
                </p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <Timer className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">Real-Time Timer</h3>
                <p className="text-sm text-muted-foreground">
                  Enforce time limits with a real-time timer and automatic submission.
                </p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <BarChart className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  Users and admins can view detailed test results immediately after submission.
                </p>
              </div>
                 <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <Users className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">User Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Secure login for users to access their assigned tests and view their results.
                </p>
              </div>
                 <div className="grid gap-1 text-center p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex justify-center items-center mb-4">
                    <div className="p-4 rounded-full bg-accent/20 text-accent">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-bold font-headline">Single Question Display</h3>
                <p className="text-sm text-muted-foreground">
                 Focus on one question at a time for a better testing experience.
                </p>
              </div>
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
