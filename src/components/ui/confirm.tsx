"use client";

import * as React from "react";
import { Sheet } from "./sheet";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "削除する",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex flex-col gap-2 pb-2 pt-4 sm:flex-row-reverse">
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-rose hover:bg-[#c08b8b] sm:w-auto"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
          やめる
        </Button>
      </div>
    </Sheet>
  );
}
