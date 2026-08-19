"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 画面の共通枠。1画面1目的にするため、タイトル・補足・主要操作だけを上に置く。
 */
export function AppPage({
  title,
  subtitle,
  back,
  action,
  children,
  showSettings = true,
}: {
  title: string;
  subtitle?: string;
  /** 戻り先のパス。指定すると左上に戻るボタンが出る。 */
  back?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  showSettings?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 md:pb-16 md:pt-24">
      <header className="mb-5">
        <div className="flex items-start gap-2">
          {back ? (
            <button
              type="button"
              onClick={() => router.push(back)}
              className="-ml-2 mt-0.5 grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
              aria-label="戻る"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className={cn("text-[22px] font-semibold leading-snug text-ink", back && "pt-1")}>
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {action}
            {showSettings ? (
              <Link
                href="/settings"
                aria-label="設定"
                className="grid size-10 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
              >
                <Settings className="size-5" />
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="animate-soft-in space-y-4">{children}</div>
    </div>
  );
}

/** 画面内のセクション見出し */
export function SectionTitle({
  children,
  href,
  linkLabel = "すべて見る",
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2 mt-6 flex items-baseline justify-between gap-3 px-1 first:mt-0">
      <h2 className="text-[13px] font-semibold tracking-wide text-ink-soft">{children}</h2>
      {href ? (
        <Link
          href={href}
          className="-my-2 inline-flex min-h-10 items-center px-1 text-[13px] font-medium text-sage-deep hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
