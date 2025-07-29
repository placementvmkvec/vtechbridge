
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/logo';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="21.17" x2="12" y1="8" y2="8" />
        <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
        <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
      </svg>
    )
}

const ADMIN_EMAIL = "loganathans@vmkvec.edu.in";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleUserLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    
    if (email !== ADMIN_EMAIL) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: "This email is not registered as an admin.",
        });
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Error signing in as admin:', error);
       toast({
          variant: 'destructive',
          title: 'Admin Login Failed',
          description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
          variant: 'destructive',
          title: 'Google Login Failed',
          description: error.message,
      });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-secondary">
      <Card className="w-full max-w-md shadow-2xl">
         <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
        </CardHeader>
        <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User Login</TabsTrigger>
                <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>

            {/* User Login Tab */}
            <TabsContent value="user">
                <form onSubmit={handleUserLogin}>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-center">User Login</CardTitle>
                        <CardDescription className="text-center">
                        Enter your credentials to access your test dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                            id="user-email"
                            name="email"
                            type="email"
                            placeholder="user@example.com"
                            required
                            className="text-base"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="user-password">Password</Label>
                        <Input id="user-password" name="password" type="password" required className="text-base" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                            </span>
                        </div>
                        </div>
                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                            <GoogleIcon className="mr-2 h-5 w-5" />
                            {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                        {"Don't have an account? "}
                        <Link
                            href="/signup"
                            className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                            Sign up
                        </Link>
                        </p>
                    </CardFooter>
                </form>
            </TabsContent>

            {/* Admin Login Tab */}
            <TabsContent value="admin">
                 <form onSubmit={handleAdminLogin}>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-center">Admin Login</CardTitle>
                        <CardDescription className="text-center">
                         Enter your administrator credentials to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                            id="admin-email"
                            name="email"
                            type="email"
                            placeholder="admin@example.com"
                            required
                            className="text-base"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input id="admin-password" name="password" type="password" required className="text-base" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105" disabled={isLoading}>
                         {isLoading ? 'Logging in...' : 'Login as Admin'}
                        </Button>
                    </CardFooter>
                </form>
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
