
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        // You would fetch regNo from your database here
        setRegNo('U20XX1234'); // Placeholder
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (user) {
      try {
        await updateProfile(user, { displayName });
        // Here you would also update the regNo in your database
        toast({
          title: 'Success!',
          description: 'Your profile has been updated successfully.',
        });
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-secondary">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-32" />
                           <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-16" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-16" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-secondary">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <form onSubmit={handleProfileUpdate}>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">My Profile</CardTitle>
              <CardDescription>
                View and edit your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={user?.photoURL ?? "https://placehold.co/100x100"} alt={user?.displayName ?? ""} data-ai-hint="user avatar" />
                  <AvatarFallback className="text-3xl">{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{user?.displayName}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-base"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="regNo">Registration No.</Label>
                    <Input
                        id="regNo"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        className="text-base"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={user?.email ?? ''}
                        disabled
                        className="text-base cursor-not-allowed bg-muted/50"
                    />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
