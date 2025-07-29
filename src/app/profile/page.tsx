
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserProfile = {
    name?: string;
    regNo?: string;
    department?: string;
    year?: string;
    sem?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [sem, setSem] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setDisplayName(currentUser.displayName || userData.name || '');
            setRegNo(userData.regNo || '');
            setDepartment(userData.department || '');
            setYear(userData.year || '');
            setSem(userData.sem || '');
        } else {
             setDisplayName(currentUser.displayName || '');
        }
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
        // Update display name in Firebase Auth
        if (displayName !== user.displayName) {
          await updateProfile(user, { displayName });
        }
        
        // Update user data in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            name: displayName,
            regNo,
            department,
            year,
            sem,
            email: user.email // keep email in doc
        }, { merge: true });

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
                View and edit your personal information. Keep it up to date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={user?.photoURL ?? "https://placehold.co/100x100"} alt={user?.displayName ?? ""} data-ai-hint="user avatar" />
                  <AvatarFallback className="text-3xl">{displayName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{displayName || "User"}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-base"
                        placeholder="Your full name"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="regNo">Registration No.</Label>
                    <Input
                        id="regNo"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        className="text-base"
                        placeholder="e.g. U20XX1234"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="text-base"
                        placeholder="e.g. Computer Science"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sem">Semester</Label>
                    <Select value={sem} onValueChange={setSem}>
                        <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1st Sem</SelectItem>
                            <SelectItem value="2">2nd Sem</SelectItem>
                            <SelectItem value="3">3rd Sem</SelectItem>
                            <SelectItem value="4">4th Sem</SelectItem>
                            <SelectItem value="5">5th Sem</SelectItem>
                            <SelectItem value="6">6th Sem</SelectItem>
                            <SelectItem value="7">7th Sem</SelectItem>
                            <SelectItem value="8">8th Sem</SelectItem>
                        </SelectContent>
                    </Select>
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
