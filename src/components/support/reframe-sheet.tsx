"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { composeIMessage, reframe, type ReframeResult } from "@/lib/support";
import { scanText } from "@/lib/safety";
import { SupportNotice } from "./support-notice";

/**
 * 言い換えの提案。
 * 元の言葉は絶対に書き換えない。
 * 機械が文章を書き直すのではなく、引っかかりやすい表現を示し、
 * 言い直しは本人の言葉で組み立ててもらう。
 */
export function ReframeSheet({
  open,
  onOpenChange,
  initialText = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
}) {
  const [text, setText] = React.useState(initialText);
  const [result, setResult] = React.useState<ReframeResult | null>(null);
  const [blocked, setBlocked] = React.useState(false);

  function run() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (scanText([trimmed]).length > 0) {
      setBlocked(true);
      setResult(null);
      return;
    }
    setBlocked(false);
    setResult(reframe(trimmed));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="言い換えを考える"
      description="あなたの感情は正しいままです。伝え方の選択肢を増やすだけの機能です。"
      footer={
        <Button size="lg" className="w-full" onClick={run} disabled={!text.trim()}>
          引っかかりやすい表現を見る
        </Button>
      }
    >
      <div className="space-y-5 py-2">
        <Field
          label="そのまま書いてみてください"
          htmlFor="reframe-input"
          hint="強い言葉でも構いません。ここに書いたものは保存されず、誰にも送られません。"
        >
          <Textarea
            id="reframe-input"
            rows={5}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：あなたはいつも私の話を聞かない。ひどいと思う。"
          />
        </Field>

        {blocked ? <SupportNotice /> : null}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-soft)] border border-line bg-paper-deep/50 px-4 py-3">
              <p className="text-[12px] font-medium text-ink-faint">元の言葉（書き換えません）</p>
              <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink">
                {result.original}
              </p>
            </div>

            {result.notes.length ? (
              <div>
                <p className="mb-1 text-[13px] font-semibold text-ink">引っかかりやすい表現</p>
                <p className="mb-2 text-[12px] leading-relaxed text-ink-faint">
                  間違いという意味ではありません。相手が身構えやすい言い方、というだけです。
                </p>
                <ul className="space-y-2">
                  {result.notes.map((note) => (
                    <li
                      key={note.found}
                      className="rounded-[var(--radius-soft)] border border-line bg-surface px-4 py-3"
                    >
                      <p className="text-[13px] font-medium text-ink">「{note.found}」</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{note.why}</p>
                      <p className="mt-1.5 text-[12px] text-ink-faint">
                        別の言い方：{note.alternatives.join(" / ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-[var(--radius-soft)] bg-sage-soft/50 px-4 py-3 text-[13px] leading-relaxed text-ink">
                相手が身構えやすい表現は見つかりませんでした。そのままでも伝わる書き方だと思います。
              </p>
            )}

            <IMessageComposer highlighted={result.hasBlaming} />
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}

/**
 * 「私」を主語にした型。
 * 機械が代わりに書くのではなく、3つに分けて本人に書いてもらう。
 */
function IMessageComposer({ highlighted }: { highlighted: boolean }) {
  const [fact, setFact] = React.useState("");
  const [feeling, setFeeling] = React.useState("");
  const [hope, setHope] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const composed = composeIMessage(fact, feeling, hope);

  async function copy() {
    if (!composed) return;
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* コピーできない環境では、そのまま選んで写してもらう */
    }
  }

  return (
    <div className="rounded-[var(--radius-soft)] border border-sage/40 bg-sage-soft/30 px-4 py-4">
      <p className="text-[13px] font-semibold text-ink">「私」を主語にして組み立てる</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
        {highlighted
          ? "相手を主語にした書き方が含まれていました。事実 → 気持ち → 望み、に分けると責める形になりにくくなります。"
          : "事実 → 気持ち → 望み、の順に分けると、伝えたい中身が届きやすくなります。"}
      </p>

      <div className="mt-3 space-y-3">
        <Field label="① 何があったか" htmlFor="im-fact" hint="評価を入れず、起きたことだけを一文で。">
          <Input
            id="im-fact"
            value={fact}
            maxLength={120}
            onChange={(e) => setFact(e.target.value)}
            placeholder="昨日、話しかけたけれど返事がなかった"
          />
        </Field>
        <Field label="② どう感じたか" htmlFor="im-feeling" hint="「〜と感じました」につながる形で。">
          <Input
            id="im-feeling"
            value={feeling}
            maxLength={80}
            onChange={(e) => setFeeling(e.target.value)}
            placeholder="さびしかった"
          />
        </Field>
        <Field label="③ どうだと嬉しいか" htmlFor="im-hope" hint="要求ではなく望みとして。「〜と嬉しいです」につながる形で。">
          <Input
            id="im-hope"
            value={hope}
            maxLength={120}
            onChange={(e) => setHope(e.target.value)}
            placeholder="ひとことだけでも返してもらえる"
          />
        </Field>
      </div>

      {composed ? (
        <div className="mt-3 rounded-[var(--radius-soft)] bg-surface px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-medium text-ink-faint">組み立てた文</p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-paper-deep px-3 text-[12px] text-ink-soft"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "コピーしました" : "コピー"}
            </button>
          </div>
          <p className="mt-1 text-[14px] leading-relaxed text-ink">{composed}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
            送るかどうかは、あとで決めて構いません。
          </p>
        </div>
      ) : null}
    </div>
  );
}
