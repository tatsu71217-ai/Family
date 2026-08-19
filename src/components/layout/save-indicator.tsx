"use client";

import { useData } from "@/lib/store/provider";

/** 保存状態とエラーの控えめな通知。画面の下に小さく出す。 */
export function SaveIndicator() {
  const { saving, error } = useData();

  if (error) {
    return (
      <div
        role="alert"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto w-fit max-w-[90vw] rounded-full bg-rose-soft px-4 py-2 text-[13px] text-[#a86f6f] shadow-sm md:bottom-6"
      >
        {error}
      </div>
    );
  }
  if (!saving) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto w-fit rounded-full bg-ink/80 px-4 py-2 text-[13px] text-white md:bottom-6"
    >
      保存中…
    </div>
  );
}
