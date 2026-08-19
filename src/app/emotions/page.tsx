"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Field, Select, Textarea } from "@/components/ui/field";
import { ScalePicker } from "@/components/ui/scale-picker";
import { ConfirmDialog } from "@/components/ui/confirm";
import { EmotionPie, EmotionTrend } from "@/components/charts/emotion-charts";
import { EMOTIONS, INTENSITY_LABELS, emotionMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import {
  emotionDistribution,
  emotionTrend,
  memberName,
  recentEmotions,
} from "@/lib/insights";
import type { EmotionKey, EmotionLog, Scale } from "@/lib/types";
import { cn, createId, formatDate, nowIso, sortByDateDesc, trimOrNull } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "1週間" },
  { days: 30, label: "1か月" },
  { days: 90, label: "3か月" },
];

export default function EmotionsPage() {
  const { data, save, remove } = useData();
  const [range, setRange] = React.useState(30);
  const form = useSheetForm<EmotionKey>();
  const [deleting, setDeleting] = React.useState<EmotionLog | null>(null);

  if (!data) return null;

  const inRange = recentEmotions(data.emotions, range);
  const distribution = emotionDistribution(inRange);
  const trend = emotionTrend(data.emotions, range === 7 ? 14 : range, 6);
  const recent = sortByDateDesc(data.emotions, (e) => e.loggedAt).slice(0, 12);

  return (
    <AppPage
      title="感情整理"
      subtitle="いまの気持ちに近いものを選ぶところから。当てはまらなくても大丈夫です。"
      back="/"
    >
      <Card>
        <CardTitle>いま、どの気持ちが近い？</CardTitle>
        <CardDescription className="mt-1">
          選ぶと、そのときのことを書き足せます。
        </CardDescription>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {EMOTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => form.openForm(option.value)}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-soft)] border border-line bg-surface px-1 py-3 transition-colors hover:bg-paper-deep"
            >
              <span aria-hidden className="text-2xl">
                {option.emoji}
              </span>
              <span className="text-[11px] leading-tight text-ink-soft">{option.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex gap-1.5 px-1">
        {RANGES.map((option) => (
          <button
            key={option.days}
            type="button"
            aria-pressed={range === option.days}
            onClick={() => setRange(option.days)}
            className={cn(
              "min-h-10 rounded-full px-4 text-[13px] font-medium transition-colors",
              range === option.days
                ? "bg-sage-soft text-sage-deep"
                : "bg-surface text-ink-faint hover:bg-paper-deep",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SectionTitle>気持ちの割合</SectionTitle>
      <Card>
        <EmotionPie data={distribution} />
      </Card>

      <SectionTitle>時間による変化</SectionTitle>
      <Card>
        <EmotionTrend data={trend} />
        <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
          「良い / 悪い」ではなく、あたたかく感じた記録と、重く感じた記録の量として見ています。
        </p>
      </Card>

      <SectionTitle>最近の記録</SectionTitle>
      {recent.length === 0 ? (
        <EmptyState
          emoji="🫧"
          title="まだ記録がありません"
          description="上のボタンから、いまの気持ちに近いものを選んでみてください。"
        />
      ) : (
        <ul className="space-y-2">
          {recent.map((log) => {
            const option = emotionMap[log.emotion];
            return (
              <li
                key={log.id}
                className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
              >
                <span aria-hidden className="text-xl">
                  {option.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[14px] font-medium text-ink">
                    {option.label}
                    <span className="text-[12px] font-normal text-ink-faint">
                      {INTENSITY_LABELS[log.intensity]}・{formatDate(log.loggedAt)}
                    </span>
                  </p>
                  {log.memberId ? (
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {memberName(data.members, log.memberId)}との関係で
                    </p>
                  ) : null}
                  {log.context ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{log.context}</p>
                  ) : null}
                  {log.desiredResponse ? (
                    <p className="mt-1.5 rounded-[var(--radius-soft)] bg-sky-soft/70 px-3 py-2 text-[13px] leading-relaxed text-ink">
                      本当はこうしたかった：{log.desiredResponse}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="この記録を削除"
                  onClick={() => setDeleting(log)}
                  className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => form.openForm()}
      >
        <Plus /> 気持ちを記録する
      </Button>

      <EmotionForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        members={data.members}
        preset={form.target}
        onSave={(log) => save("emotions", log)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="この記録を削除しますか？"
        onConfirm={() => {
          if (deleting) remove("emotions", deleting.id);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}

function EmotionForm({
  open,
  onOpenChange,
  familyId,
  members,
  preset,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  members: { id: string; name: string; avatar: string }[];
  preset: EmotionKey | null;
  onSave: (log: EmotionLog) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const [emotion, setEmotion] = React.useState<EmotionKey>(preset ?? "joy");
  const [intensity, setIntensity] = React.useState<Scale>(3);
  const [memberId, setMemberId] = React.useState<string>("");
  const [context, setContext] = React.useState("");
  const [desiredResponse, setDesiredResponse] = React.useState("");

  function submit() {
    const ts = nowIso();
    onSave({
      id: createId(),
      familyId,
      memberId: memberId || null,
      emotion,
      intensity,
      context: trimOrNull(context),
      desiredResponse: trimOrNull(desiredResponse),
      loggedAt: ts,
      createdAt: ts,
    });
    onOpenChange(false);
  }

  const option = emotionMap[emotion];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="気持ちを記録する"
      description="正確でなくて大丈夫です。近いものを選んでください。"
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          記録する
        </Button>
      }
    >
      <div className="space-y-5 py-2">
        <Field label="どの気持ちが近い？">
          <div className="grid grid-cols-5 gap-2">
            {EMOTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={emotion === item.value}
                onClick={() => setEmotion(item.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--radius-soft)] border px-1 py-3 transition-colors",
                  emotion === item.value
                    ? "border-sage bg-sage-soft"
                    : "border-line bg-surface hover:bg-paper-deep",
                )}
              >
                <span aria-hidden className="text-2xl">
                  {item.emoji}
                </span>
                <span className="text-[11px] leading-tight text-ink-soft">{item.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={`「${option.label}」の強さ`}>
          <ScalePicker value={intensity} onChange={setIntensity} labels={INTENSITY_LABELS} name="強さ" />
        </Field>

        <Field label="誰との関係で？" htmlFor="emotion-member" hint="特定の人でなければ空のままで大丈夫です。">
          <Select id="emotion-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">特定の人ではない</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="何が起きた？" htmlFor="emotion-context">
          <Textarea
            id="emotion-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={1000}
            placeholder="そのときのことを、覚えている範囲で"
          />
        </Field>

        <Field
          label="本当はどうしたかった？"
          htmlFor="emotion-desired"
          hint="できなかったことを責めるためではなく、自分の望みを見るために。"
        >
          <Textarea
            id="emotion-desired"
            value={desiredResponse}
            onChange={(e) => setDesiredResponse(e.target.value)}
            maxLength={500}
          />
        </Field>
      </div>
    </Sheet>
  );
}
