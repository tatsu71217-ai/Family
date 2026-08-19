"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Field, Textarea } from "@/components/ui/field";
import { EmotionPie } from "@/components/charts/emotion-charts";
import { actionStatusMap, emotionMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { emotionDistribution, memberName, organizeSummary, reviewStats } from "@/lib/insights";
import type { ReviewNote } from "@/lib/types";
import { createId, formatDate, nowIso, sortByDateDesc, todayInput, trimOrNull } from "@/lib/utils";

export default function ReviewPage() {
  const { data, save } = useData();
  const form = useSheetForm<ReviewNote>();

  if (!data) return null;

  const stats = reviewStats(data, 30);
  const summary = organizeSummary(data);
  const distribution = emotionDistribution(stats.emotions);
  const notes = sortByDateDesc(data.reviews, (r) => r.createdAt);

  const toneDiff = {
    warm: stats.emotionTone.warm - stats.previousTone.warm,
    heavy: stats.emotionTone.heavy - stats.previousTone.heavy,
  };

  return (
    <AppPage title="振り返り" subtitle="この1か月に何があって、何が少し動いたかを見ます。" back="/">
      <Card className="bg-sage-soft/40">
        <CardTitle>この1か月の整理</CardTitle>
        <CardDescription className="mt-1">
          入力した内容を並べ直しただけのものです。診断ではありません。
        </CardDescription>

        <div className="mt-4 space-y-4">
          <SummaryBlock title="いまの状況" items={summary.situation} />
          <SummaryBlock title="よく出てきた気持ち" items={summary.emotions} />
          <SummaryBlock title="気にかかっていること" items={summary.issues} />
          <SummaryBlock title="大切にしていること" items={summary.cherished} />
          <SummaryBlock title="次にできそうな小さなこと" items={summary.nextSteps} />
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
          このまとめは、あなたの端末の中で作られています。外部のサービスへは送っていません。
        </p>
      </Card>

      <SectionTitle href="/emotions" linkLabel="感情整理へ">
        最近の気持ち
      </SectionTitle>
      <Card>
        <EmotionPie data={distribution} />
        {stats.emotions.length ? (
          <p className="mt-4 rounded-[var(--radius-soft)] bg-paper-deep px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            前の1か月とくらべると、あたたかい記録は{describeDiff(toneDiff.warm)}、
            重い記録は{describeDiff(toneDiff.heavy)}です。
            <span className="mt-1 block text-[12px] text-ink-faint">
              どちらが良い・悪いではなく、量の変化として見ています。
            </span>
          </p>
        ) : null}
      </Card>

      <SectionTitle href="/timeline" linkLabel="タイムラインへ">
        この期間の出来事
      </SectionTitle>
      {stats.events.length ? (
        <div className="space-y-2">
          {stats.events.slice(0, 5).map((event) => {
            const emotion = event.emotion ? emotionMap[event.emotion] : null;
            return (
              <Card key={event.id} className="py-4">
                <p className="text-[12px] text-ink-faint">{formatDate(event.eventDate)}</p>
                <p className="mt-0.5 text-[14px] font-medium text-ink">
                  {emotion ? <span aria-hidden className="mr-1">{emotion.emoji}</span> : null}
                  {event.title}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState emoji="🕰️" title="この期間の出来事はまだありません" />
      )}

      <SectionTitle href="/actions" linkLabel="行動へ">
        やってみたこと
      </SectionTitle>
      {stats.doneActions.length ? (
        <div className="space-y-2">
          {stats.doneActions.map((action) => (
            <Card key={action.id} className="py-4">
              <p className="text-[14px] text-ink">
                <span aria-hidden className="mr-1">{actionStatusMap.done.emoji}</span>
                {action.title}
              </p>
              {action.targetMemberId ? (
                <p className="mt-0.5 text-[12px] text-ink-faint">
                  {memberName(data.members, action.targetMemberId)}へ
                </p>
              ) : null}
              {action.afterFeeling ? (
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{action.afterFeeling}</p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🌱"
          title="この期間に実行済みの行動はありません"
          description="できなかったことは、うまくいかなかったこととは限りません。"
          action={
            <Button asChild variant="outline">
              <Link href="/actions">行動を見る</Link>
            </Button>
          }
        />
      )}

      <SectionTitle>書き留めた振り返り</SectionTitle>
      {notes.length === 0 ? (
        <EmptyState
          emoji="📔"
          title="まだ振り返りがありません"
          description="良かったこと・まだ気になることを、そのまま書いておけます。"
          action={
            <Button onClick={() => form.openForm()}>
              <Plus /> 振り返りを書く
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => form.openForm(note)}
              className="w-full rounded-[var(--radius-card)] border border-line bg-surface p-5 text-left transition-colors hover:bg-paper-deep/60"
            >
              <p className="text-[12px] text-ink-faint">
                {formatDate(note.periodStart)} 〜 {formatDate(note.periodEnd)}
              </p>
              {note.wentWell ? (
                <p className="mt-2 text-[13px] leading-relaxed text-ink">
                  <span className="font-medium">良かったこと：</span>
                  {note.wentWell}
                </p>
              ) : null}
              {note.stillOnMind ? (
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                  <span className="font-medium">まだ気になること：</span>
                  {note.stillOnMind}
                </p>
              ) : null}
              {note.noticedChange ? (
                <p className="mt-2 rounded-[var(--radius-soft)] bg-sky-soft/60 px-3 py-2 text-[13px] leading-relaxed text-ink">
                  気づいた変化：{note.noticedChange}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {notes.length > 0 ? (
        <Button variant="outline" size="lg" className="w-full" onClick={() => form.openForm()}>
          <Plus /> 振り返りを書く
        </Button>
      ) : null}

      <ReviewForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        note={form.target}
        onSave={(note) => save("reviews", note)}
      />
    </AppPage>
  );
}

function SummaryBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-ink-faint">{title}</h3>
      {items.length ? (
        <ul className="mt-1 space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-[13px] leading-relaxed text-ink">
              ・{item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[13px] text-ink-faint">まだ書かれていません。</p>
      )}
    </div>
  );
}

function describeDiff(diff: number): string {
  if (diff > 0) return `${diff}件多い`;
  if (diff < 0) return `${Math.abs(diff)}件少ない`;
  return "同じくらい";
}

function ReviewForm({
  open,
  onOpenChange,
  familyId,
  note,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  note: ReviewNote | null;
  onSave: (note: ReviewNote) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const [wentWell, setWentWell] = React.useState(note?.wentWell ?? "");
  const [stillOnMind, setStillOnMind] = React.useState(note?.stillOnMind ?? "");
  const [noticedChange, setNoticedChange] = React.useState(note?.noticedChange ?? "");

  function submit() {
    const ts = nowIso();
    const today = todayInput();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    onSave({
      id: note?.id ?? createId(),
      familyId,
      periodStart: note?.periodStart ?? monthAgo,
      periodEnd: note?.periodEnd ?? today,
      wentWell: trimOrNull(wentWell),
      stillOnMind: trimOrNull(stillOnMind),
      noticedChange: trimOrNull(noticedChange),
      createdAt: note?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={note ? "振り返りを編集" : "振り返りを書く"}
      description="できた・できなかったの二択にしなくて大丈夫です。"
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          保存する
        </Button>
      }
    >
      <div className="space-y-5 py-2">
        <Field label="良かったこと" htmlFor="review-well" hint="小さなことほど、書いておく価値があります。">
          <Textarea id="review-well" value={wentWell} onChange={(e) => setWentWell(e.target.value)} maxLength={1000} />
        </Field>
        <Field label="まだ気になること" htmlFor="review-mind" hint="解決しなくても、置いておけます。">
          <Textarea
            id="review-mind"
            value={stillOnMind}
            onChange={(e) => setStillOnMind(e.target.value)}
            maxLength={1000}
          />
        </Field>
        <Field label="気づいた変化" htmlFor="review-change" hint="前とくらべて、ほんの少しでも違うと感じたこと。">
          <Textarea
            id="review-change"
            value={noticedChange}
            onChange={(e) => setNoticedChange(e.target.value)}
            maxLength={1000}
          />
        </Field>
      </div>
    </Sheet>
  );
}
