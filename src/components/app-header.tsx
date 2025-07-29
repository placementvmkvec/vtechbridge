
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          <nav className="flex items-center space-x-2">
            {isLandingPage ? (
              <Link href="/login">
                  <Button>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
              </Link>
            ) : (
               <UserNav />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
