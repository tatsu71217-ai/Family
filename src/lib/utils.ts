import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 端末に依存しないID生成（crypto.randomUUID が無い環境へのフォールバック付き） */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // UUID v4 形式を保つ（Postgres の uuid 列にそのまま入れられるようにするため）
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** YYYY-MM-DD（input[type=date] 用） */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function todayInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "日付なし";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "日付なし";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatRelative(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 1000) return "たった今";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分前`;
  if (diff < day) return `${Math.floor(diff / (60 * 60 * 1000))}時間前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}日前`;
  return formatDate(value);
}

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** 直近 n 日以内かどうか */
export function isWithinDays(value: string | null | undefined, days: number): boolean {
  if (!value) return false;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

export function sortByDateDesc<T>(items: T[], key: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const av = new Date(key(a) ?? 0).getTime();
    const bv = new Date(key(b) ?? 0).getTime();
    return (Number.isNaN(bv) ? 0 : bv) - (Number.isNaN(av) ? 0 : av);
  });
}

/** 表示前に前後の空白を落とす。空文字は null に正規化する */
export function trimOrNull(value: string | null | undefined): string | null {
  const t = (value ?? "").trim();
  return t.length ? t : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
