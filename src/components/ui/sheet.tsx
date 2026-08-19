"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * モバイル優先のボトムシート。デスクトップでは中央のカードになる。
 * フォーム類はすべてこの上に載せる（画面遷移を減らして迷子にならないため）。
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]"
          style={{ animation: "overlay-in .2s ease-out" }}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-surface",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(560px,calc(100vw-2rem))]",
            "sm:max-h-[86dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px]",
          )}
          style={{ animation: "sheet-in .24s ease-out" }}
        >
          <div className="shrink-0 px-5 pb-2 pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-base font-semibold text-ink">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                    {description}
                  </DialogPrimitive.Description>
                ) : (
                  <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
                aria-label="閉じる"
              >
                <X className="size-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>

          {footer ? (
            <div
              className="shrink-0 border-t border-line-soft bg-surface px-5 pb-[max(1rem,var(--safe-bottom))] pt-3 sm:rounded-b-[24px]"
            >
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
