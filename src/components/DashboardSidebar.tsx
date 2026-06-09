"use client";

import { api } from "@/trpc/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface Props {
  locale: string;
  userEmail: string;
}

interface NavItem {
  label: string;
  href: string;
}

export function DashboardSidebar({ locale, userEmail }: Props) {
  const pathname = usePathname();
  const { data: categories } = api.category.list.useQuery();

  const isActive = (href: string) => pathname === href;

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        background: isActive(item.href) ? "var(--color-border-subtle)" : "transparent",
        color: isActive(item.href) ? "var(--color-foreground)" : "var(--color-muted)",
        fontWeight: isActive(item.href) ? 500 : 400,
      }}
    >
      {item.label}
    </Link>
  );

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <span className="text-base font-bold tracking-tight" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
          Dashboard
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

        {/* Tasks */}
        <p className="px-3 pt-1 pb-1 text-xs uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.5 }}>Tasks</p>
        {navLink({ label: "All tasks", href: `/${locale}/dashboard` })}

        {categories && categories.length > 0 && categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${locale}/dashboard?category=${cat.id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "var(--color-muted)" }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 truncate">{cat.name}</span>
            <span className="text-xs" style={{ opacity: 0.5 }}>{cat._count.todos}</span>
          </Link>
        ))}

        {navLink({ label: "Manage categories", href: `/${locale}/dashboard/categories` })}

        {/* Journal */}
        <p className="px-3 pt-4 pb-1 text-xs uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.5 }}>Journal</p>
        {navLink({ label: "Daily Journal", href: `/${locale}/dashboard/journal` })}

        {/* Fitness */}
        <p className="px-3 pt-4 pb-1 text-xs uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.5 }}>Health</p>
        {navLink({ label: "Fitness Tracker", href: `/${locale}/dashboard/fitness` })}

        {/* News */}
        <p className="px-3 pt-4 pb-1 text-xs uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.5 }}>News</p>
        {navLink({ label: "Top News", href: `/${locale}/dashboard/news` })}

      </nav>

      <div className="px-3 pb-4 pt-3 space-y-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
        <LocaleSwitcher />
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs truncate flex-1" style={{ color: "var(--color-muted)" }}>{userEmail}</span>
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/auth/signin` })}
            className="text-xs ml-2 shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-muted)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
