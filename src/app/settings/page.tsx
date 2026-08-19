"use client";

import * as React from "react";
import { Download, Upload, LogOut, RefreshCcw, ShieldCheck } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useData } from "@/lib/store/provider";
import type { FamilySnapshot } from "@/lib/types";

const RULES = [
  "家族を「敵」として扱いません。",
  "相手の心理を断定しません。",
  "「正しい家族関係」を押し付けません。",
  "改善を強制しません。",
  "整理するのは、あなた自身の感情・認識・希望です。",
];

export default function SettingsPage() {
  const {
    data,
    mode,
    isDemo,
    email,
    renameFamily,
    resetToDemo,
    startEmpty,
    importSnapshot,
    signOut,
  } = useData();
  const familyName = data?.family.name ?? "";
  const [name, setName] = React.useState(familyName);
  const [lastFamilyName, setLastFamilyName] = React.useState(familyName);
  const [confirm, setConfirm] = React.useState<"demo" | "empty" | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // 読み込み完了や名前の変更に、描画中に合わせる
  if (lastFamilyName !== familyName) {
    setLastFamilyName(familyName);
    setName(familyName);
  }

  if (!data) return null;

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kazoku-map-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as FamilySnapshot;
      if (!parsed?.family?.id || !Array.isArray(parsed.members)) {
        throw new Error("形式が違うようです。");
      }
      await importSnapshot(parsed);
    } catch (e) {
      setImportError(
        e instanceof Error ? `読み込めませんでした：${e.message}` : "読み込めませんでした。",
      );
    }
  }

  return (
    <AppPage title="設定" back="/" showSettings={false}>
      {isDemo ? (
        <Card className="border-sand/50 bg-sand-soft/50">
          <CardTitle>いまはデモデータです</CardTitle>
          <CardDescription className="mt-1">
            表示されている家族・関係・出来事は、機能を試すためのサンプルです。
            実在の人物についての診断や評価ではありません。
            自分の記録を始めるときは、いったん空にすると混ざりません。
          </CardDescription>
          <Button className="mt-4" onClick={() => setConfirm("empty")}>
            空の状態から始める
          </Button>
        </Card>
      ) : null}

      <SectionTitle>この家族の名前</SectionTitle>
      <Card>
        <Field label="呼び名" htmlFor="family-name" hint="アプリ内の表示だけに使います。">
          <Input
            id="family-name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const trimmed = name.trim();
              if (trimmed && trimmed !== data.family.name) renameFamily(trimmed);
              else setName(data.family.name);
            }}
          />
        </Field>
      </Card>

      <SectionTitle>データの保存先</SectionTitle>
      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sage-deep" aria-hidden />
          <div>
            {mode === "supabase" ? (
              <>
                <CardTitle>アカウントに保存しています</CardTitle>
                <CardDescription className="mt-1">
                  {email ? `${email} のアカウント内にだけ保存されます。` : "ログイン中のアカウント内にだけ保存されます。"}
                  行単位のアクセス制御（RLS）により、ほかの人からは読み書きできません。
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>この端末の中だけに保存しています</CardTitle>
                <CardDescription className="mt-1">
                  記録はブラウザの中に保存され、どこにも送信されません。
                  端末を変えても引き継ぐには、下から書き出して読み込んでください。
                </CardDescription>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download /> データを書き出す
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> データを読み込む
          </Button>
          {mode === "supabase" ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> ログアウト
            </Button>
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          aria-label="書き出したJSONファイルを選ぶ"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importJson(file);
            e.target.value = "";
          }}
        />

        {importError ? (
          <p role="alert" className="mt-3 text-[13px] text-[#a86f6f]">
            {importError}
          </p>
        ) : null}
      </Card>

      <SectionTitle>やり直す</SectionTitle>
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirm("empty")}>
            <RefreshCcw /> すべて消して空にする
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm("demo")}>
            デモデータに戻す
          </Button>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-faint">
          消したデータは元に戻せません。心配なときは、先に書き出しておいてください。
        </p>
      </Card>

      <SectionTitle>このアプリの約束</SectionTitle>
      <Card>
        <ul className="space-y-2">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
              <span aria-hidden className="text-sage-deep">
                ・
              </span>
              {rule}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-[var(--radius-soft)] bg-paper-deep px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
          このアプリは、医療や心理の診断を行うものではありません。
          気持ちがつらいときや、安全に関わる不安があるときは、
          信頼できる人や専門の窓口に相談することも考えてみてください。
        </p>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "demo" ? "デモデータに戻しますか？" : "すべて消して空にしますか？"}
        description="いま入力されている内容はすべて消えます。元に戻すことはできません。"
        confirmLabel={confirm === "demo" ? "デモに戻す" : "空にする"}
        onConfirm={() => {
          if (confirm === "demo") resetToDemo();
          if (confirm === "empty") startEmpty();
          setConfirm(null);
        }}
      />
    </AppPage>
  );
}
