import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  emoji,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { emoji?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-paper-deep text-ink-soft",
        className,
      )}
      {...props}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      {children}
    </span>
  );
}
