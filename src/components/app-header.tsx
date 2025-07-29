
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";


export function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <header className={cn("sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6", className)}>
       {isAdminPage ? (
            <SidebarTrigger className="sm:hidden" />
       ) : (
            <Logo />
       )}
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
    </header>
  );
}
