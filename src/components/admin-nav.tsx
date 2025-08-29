
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();
  
  const routes = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      active: pathname === "/admin/dashboard",
    },
     {
      href: "/admin/exams",
      label: "MCQ Exams",
      active: pathname.startsWith("/admin/exams") || pathname.startsWith("/admin/analytics"),
    },
    {
      href: "/admin/coding",
      label: "Coding Problems",
      active: pathname.startsWith("/admin/coding") && !pathname.startsWith("/admin/coding-exams") && !pathname.startsWith("/admin/coding-submissions"),
    },
    {
      href: "/admin/coding-exams",
      label: "Coding Exams",
      active: pathname.startsWith("/admin/coding-exams"),
    },
    {
        href: "/admin/coding-submissions",
        label: "Coding Submissions",
        active: pathname.startsWith("/admin/coding-submissions"),
    },
    {
      href: "/admin/users",
      label: "Users",
      active: pathname === "/admin/users",
    },
    {
      href: "/admin/submissions",
      label: "MCQ Submissions",
      active: pathname.startsWith("/admin/submissions"),
    },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
