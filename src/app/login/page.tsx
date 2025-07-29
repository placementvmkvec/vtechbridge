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

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd have authentication logic here.
    // We'll just redirect to the dashboard for this demo.
    router.push('/dashboard');
  };

  const handleAdminLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/admin/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-3xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your test dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required className="text-base" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Login as User
            </Button>
            <Button onClick={handleAdminLogin} variant="outline" className="w-full">
              Login as Admin
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
