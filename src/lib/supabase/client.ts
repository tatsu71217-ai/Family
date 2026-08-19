import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ブラウザ用 Supabase クライアント。
 * 使うのは公開用の anon key のみ。Service Role Key は絶対にクライアントへ置かない
 * （サーバー側でも本アプリでは使用しない）。
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
