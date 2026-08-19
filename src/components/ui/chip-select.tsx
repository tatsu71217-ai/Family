"use client";

import type { Option } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  label,
  columns = "auto",
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  columns?: "auto" | "grid";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(columns === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-wrap gap-2")}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              selected
                ? "border-transparent ring-2 ring-sage/45"
                : "border-line bg-surface text-ink-soft hover:bg-paper-deep",
              selected && option.chip,
            )}
          >
            <span aria-hidden className="text-base">{option.emoji}</span>
            <span className="font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiMemberSelect({
  members,
  value,
  onChange,
}: {
  members: { id: string; name: string; avatar: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  if (!members.length) {
    return <p className="text-[13px] text-ink-faint">まず「家族」から人を追加すると選べます。</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const selected = value.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? value.filter((id) => id !== m.id) : [...value, m.id])
            }
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              selected
                ? "border-transparent bg-sage-soft text-sage-deep ring-2 ring-sage/40"
                : "border-line bg-surface text-ink-soft hover:bg-paper-deep",
            )}
          >
            <span aria-hidden>{m.avatar}</span>
            <span className="font-medium">{m.name}</span>
          </button>
        );
      })}
    </div>
  );
}
