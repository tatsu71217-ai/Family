"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useData } from "@/lib/store/provider";

/**
 * Supabase を設定している場合のログイン画面。
 * 家族の記録はとてもプライベートなので、本人以外が開けないようにする。
 */
export function AuthGate() {
  const { supabase } = useData();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage("確認メールを送りました。メール内のリンクを開いてください。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "うまくいきませんでした。");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div aria-hidden className="mb-3 text-4xl">
          🗺️
        </div>
        <h1 className="text-xl font-semibold text-ink">家族関係の地図</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          家族を責めるためではなく、家族を理解するために。
          <br />
          記録はあなたのアカウントの中だけに保存されます。
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <Field label="メールアドレス" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="パスワード" htmlFor="password" hint="8文字以上をおすすめします。">
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-[var(--radius-soft)] bg-rose-soft px-4 py-3 text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-[var(--radius-soft)] bg-sage-soft px-4 py-3 text-[13px] text-sage-deep">{message}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "処理中…" : mode === "signin" ? "ログイン" : "アカウントを作る"}
        </Button>

        <button
          type="button"
          className="w-full text-center text-[13px] text-ink-soft underline underline-offset-4"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "signin" ? "アカウントを作る" : "ログインに戻る"}
        </button>
      </form>
    </main>
  );
}
