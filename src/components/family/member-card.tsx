"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { moodMap } from "@/lib/constants";
import type { FamilyMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MemberCard({
  member,
  relationCount,
  className,
}: {
  member: FamilyMember;
  relationCount?: number;
  className?: string;
}) {
  const mood = moodMap[member.mood];
  return (
    <Link
      href={`/family/${member.id}`}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:bg-paper-deep/60",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-full bg-paper-deep text-2xl"
      >
        {member.avatar}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-ink">{member.name}</span>
          {member.isSelf ? (
            <span className="shrink-0 rounded-full bg-sage-soft px-2 py-0.5 text-[11px] font-medium text-sage-deep">
              自分
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-faint">
          <span>{member.relation}</span>
          {typeof relationCount === "number" ? <span>· 関係 {relationCount}件</span> : null}
        </span>
      </span>
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", mood.chip)}>
        <span aria-hidden>{mood.emoji}</span> {mood.label}
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}
