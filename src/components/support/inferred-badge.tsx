import { cn } from "@/lib/utils";

/**
 * 数え上げではなく推測を含む表示に必ず付けるしるし。
 * 端末の中の記録から組み立てた見立てであって、事実の断定ではないことを示す。
 */
export function InferredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-lilac-soft px-2 py-0.5 text-[11px] font-medium text-[#7d6ea6]",
        className,
      )}
      title="記録から組み立てた推測です。診断や事実の断定ではありません。"
    >
      <span aria-hidden>◇</span>
      推測
    </span>
  );
}
