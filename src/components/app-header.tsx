import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          <nav className="flex items-center space-x-2">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
