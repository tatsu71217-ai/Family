import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  emoji = "🌱",
  title,
  description,
  action,
  className,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div aria-hidden className="mb-3 text-3xl">
        {emoji}
      </div>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
