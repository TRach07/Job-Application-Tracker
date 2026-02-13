"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  BarChart3,
  Bell,
  Settings,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.applications, href: "/applications", icon: Kanban },
    { label: t.nav.followUps, href: "/follow-ups", icon: Bell },
    { label: t.nav.analytics, href: "/analytics", icon: BarChart3 },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <Briefcase className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">JobTracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
