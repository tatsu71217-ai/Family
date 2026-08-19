"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, MessageSquareQuote, Plus, SkipForward } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";
import { InferredBadge } from "@/components/support/inferred-badge";
import { SupportNotice } from "@/components/support/support-notice";
import { ReframeSheet } from "@/components/support/reframe-sheet";
import { useData } from "@/lib/store/provider";
import { hasSafetySignal } from "@/lib/safety";
import {
  buildActionProposals,
  buildInsights,
  buildPrompts,
  type ReflectivePrompt,
} from "@/lib/support";
import type { FamilyAction, MemberProfile } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export default function InsightsPage() {
  const { data, save } = useData();
  const [reframeOpen, setReframeOpen] = React.useState(false);
  const [skipped, setSkipped] = React.useState<string[]>([]);
  const [addedAction, setAddedAction] = React.useState<string | null>(null);

  if (!data) return null;

  // 安全に関わる記述があるときは、気づき・問いかけ・行動提案をすべて止める
  const blocked = hasSafetySignal(data);

  const insights = blocked ? [] : buildInsights(data);
  const prompts = blocked ? [] : buildPrompts(data).filter((p) => !skipped.includes(p.id));
  const proposals = blocked ? [] : buildActionProposals(data);

  function addAction(title: string, memberId?: string | null) {
    if (!data) return;
    const ts = nowIso();
    const action: FamilyAction = {
      id: createId(),
      familyId: data.family.id,
      targetMemberId: memberId ?? null,
      title: title.slice(0, 120),
      dueDate: null,
      status: "todo",
      afterFeeling: null,
      reflection: null,
      createdAt: ts,
      updatedAt: ts,
    };
    save("actions", action);
    setAddedAction(title);
    window.setTimeout(() => setAddedAction(null), 2600);
  }

  function saveAnswer(prompt: ReflectivePrompt, answer: string) {
    if (!data || !prompt.saveTo) return;
    const member = data.members.find((m) => m.id === prompt.saveTo!.memberId);
    if (!member) return;
    const field = prompt.saveTo.field as keyof MemberProfile;
    const existing = member.profile[field].trim();
    const next = existing ? `${existing}\n${answer}` : answer;
    save("members", {
      ...member,
      profile: { ...member.profile, [field]: next },
      updatedAt: nowIso(),
    });
    setSkipped((current) => [...current, prompt.id]);
  }

  return (
    <AppPage
      title="気づき"
      subtitle="書いてきた記録から見えることを並べます。診断でも助言でもありません。"
      back="/"
    >
      {blocked ? (
        <>
          <SupportNotice />
          <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
            この画面の気づき・問いかけ・行動の提案は、いまは表示していません。
            記録の追加や見直しは、これまでどおり続けられます。
          </p>
        </>
      ) : (
        <>
          <Card className="bg-sage-soft/30">
            <CardTitle>この画面について</CardTitle>
            <CardDescription className="mt-1">
              あなたが書いた記録だけを、この端末の中で並べ直しています。
              外部のサービスへは何も送っていません。
              「
              <span className="font-medium">推測</span>
              」のしるしが付いたものは、事実ではなく見立てです。
            </CardDescription>
          </Card>

          <SectionTitle>気づいたこと</SectionTitle>
          {insights.length === 0 ? (
            <EmptyState
              emoji="🫧"
              title="まだ並べられることがありません"
              description="家族・関係・出来事・気持ちのどれかが少し溜まると、ここに見えてくるものが出てきます。"
              action={
                <Button asChild variant="outline">
                  <Link href="/emotions">気持ちを記録する</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <article
                  key={insight.id}
                  className="rounded-[var(--radius-card)] border border-line bg-surface p-5"
                >
                  <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-ink">
                      {insight.title}
                    </h3>
                    {insight.inferred ? <InferredBadge className="mt-0.5" /> : null}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{insight.body}</p>
                  {insight.link ? (
                    <Link
                      href={insight.link.href}
                      className="mt-3 inline-flex min-h-10 items-center gap-1 text-[13px] font-medium text-sage-deep"
                    >
                      {insight.link.label}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <SectionTitle>考えてみる問い</SectionTitle>
          {prompts.length === 0 ? (
            <EmptyState emoji="💭" title="いまお渡しできる問いはありません" />
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onSkip={() => setSkipped((current) => [...current, prompt.id])}
                  onSave={(answer) => saveAnswer(prompt, answer)}
                />
              ))}
            </div>
          )}
          <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
            答えなくても構いません。書き留めた内容は、その人のプロフィールに残ります。
          </p>

          <SectionTitle href="/actions">やってみられそうなこと</SectionTitle>
          {proposals.length === 0 ? (
            <EmptyState
              emoji="🌱"
              title="いま提案できることはありません"
              description="課題に「今できる小さな改善」を書くと、ここから行動に移せます。"
            />
          ) : (
            <div className="space-y-2">
              {proposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="rounded-[var(--radius-card)] border border-line bg-surface p-5"
                >
                  <p className="text-[14px] leading-relaxed text-ink">{proposal.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                    {proposal.because}
                  </p>
                  <Button
                    variant="soft"
                    size="sm"
                    className="mt-3"
                    onClick={() => addAction(proposal.title, proposal.memberId)}
                  >
                    <Plus />
                    {addedAction === proposal.title ? "行動に入れました" : "行動に入れる"}
                  </Button>
                </article>
              ))}
            </div>
          )}
          <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
            提案はどれも、あなただけで完結し、相手が変わることを前提にしないものに限っています。
          </p>

          <SectionTitle>伝え方に迷ったら</SectionTitle>
          <Card>
            <CardTitle>言い換えを考える</CardTitle>
            <CardDescription className="mt-1">
              強い言葉で書いたものを、読み返しやすい形にした案を並べて見られます。
              元の言葉は書き換えません。あなたの感情は、そのままで正しいままです。
            </CardDescription>
            <Button variant="outline" className="mt-4" onClick={() => setReframeOpen(true)}>
              <MessageSquareQuote /> 開く
            </Button>
          </Card>
        </>
      )}

      <ReframeSheet open={reframeOpen} onOpenChange={setReframeOpen} />
    </AppPage>
  );
}

function PromptCard({
  prompt,
  onSkip,
  onSave,
}: {
  prompt: ReflectivePrompt;
  onSkip: () => void;
  onSave: (answer: string) => void;
}) {
  const [answer, setAnswer] = React.useState("");
  const [writing, setWriting] = React.useState(false);

  return (
    <article className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h3 className="text-[15px] font-semibold leading-snug text-ink">{prompt.question}</h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">{prompt.because}</p>

      {writing && prompt.saveTo ? (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={3}
            value={answer}
            maxLength={800}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="思いついたことだけで大丈夫です"
            aria-label={prompt.question}
          />
          <p className="text-[12px] text-ink-faint">
            「{prompt.saveTo.fieldLabel}」に書き足されます。
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(answer.trim())} disabled={!answer.trim()}>
              書き留める
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWriting(false)}>
              やめる
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {prompt.saveTo ? (
            <Button variant="outline" size="sm" onClick={() => setWriting(true)}>
              書き留める
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onSkip}>
            <SkipForward /> この問いは飛ばす
          </Button>
        </div>
      )}
    </article>
  );
}
