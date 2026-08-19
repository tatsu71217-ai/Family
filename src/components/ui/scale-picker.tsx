"use client";

import { SCALE_VALUES } from "@/lib/constants";
import type { Scale } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 1〜5 の段階を、数字だけでなく言葉でも示すピッカー。 */
export function ScalePicker({
  value,
  onChange,
  labels,
  name,
}: {
  value: Scale;
  onChange: (value: Scale) => void;
  labels: Record<Scale, string>;
  name: string;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label={name} className="flex gap-2">
        {SCALE_VALUES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${v} — ${labels[v]}`}
            onClick={() => onChange(v)}
            className={cn(
              "h-11 flex-1 rounded-[var(--radius-soft)] border text-[15px] font-medium transition-colors",
              value === v
                ? "border-sage bg-sage-soft text-sage-deep"
                : "border-line bg-surface text-ink-faint hover:bg-paper-deep",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">{labels[value]}</p>
    </div>
  );
}
