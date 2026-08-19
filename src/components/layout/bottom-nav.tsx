"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Share2, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/family", label: "家族", icon: Users },
  { href: "/map", label: "関係", icon: Share2 },
  { href: "/issues", label: "課題", icon: NotebookPen },
  { href: "/actions", label: "行動", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:top-0 md:bottom-auto md:border-b md:border-t-0"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2 pb-[var(--safe-bottom)] md:justify-center md:gap-2 md:px-4 md:pb-0">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                  "md:min-h-[52px] md:flex-row md:gap-2 md:px-4 md:text-sm",
                  active ? "text-sage-deep" : "text-ink-faint hover:text-ink-soft",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full transition-colors",
                    active ? "bg-sage-soft px-3 py-1 md:px-2.5" : "px-3 py-1 md:px-2.5",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
