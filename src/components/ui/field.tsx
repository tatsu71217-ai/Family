"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      {hint ? <p className="text-xs leading-relaxed text-ink-faint">{hint}</p> : null}
      {children}
    </div>
  );
}

const controlClass =
  // text-base(16px) は必須。iOS Safari は 16px 未満の入力欄にフォーカスすると画面を勝手に拡大する。
  "w-full rounded-[var(--radius-soft)] border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-sage focus:outline-none disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlClass, "h-12", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(controlClass, "resize-y leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(controlClass, "h-12 appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";
