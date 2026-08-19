"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ChipSelect, MultiMemberSelect } from "@/components/ui/chip-select";
import { ScalePicker } from "@/components/ui/scale-picker";
import { ConfirmDialog } from "@/components/ui/confirm";
import { EMOTIONS, IMPORTANCE_LABELS, emotionMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { memberName } from "@/lib/insights";
import type { EmotionKey, FamilyEvent, Scale } from "@/lib/types";
import { createId, formatDate, nowIso, todayInput, trimOrNull } from "@/lib/utils";

export default function TimelinePage() {
  const { data, save, remove } = useData();
  const form = useSheetForm<FamilyEvent>();
  const [deleting, setDeleting] = React.useState<FamilyEvent | null>(null);

  if (!data) return null;

  // 古い順に並べて、上から下へ時間が流れる形にする
  const sorted = [...data.events].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const groups = new Map<string, FamilyEvent[]>();
  for (const event of sorted) {
    const year = event.eventDate.slice(0, 4) || "日付なし";
    groups.set(year, [...(groups.get(year) ?? []), event]);
  }

  return (
    <AppPage
      title="出来事タイムライン"
      subtitle="家族の関係に影響した出来事を、時間の流れとして置いていきます。"
      back="/"
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label="出来事を追加"
          onClick={() => form.openForm()}
        >
          <Plus />
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          emoji="🕰️"
          title="まだ出来事がありません"
          description="小さなことでも大丈夫です。覚えている順に書き足していけます。"
          action={
            <Button onClick={() => form.openForm()}>
              <Plus /> 出来事を追加
            </Button>
          }
        />
      ) : (
        <div className="relative pl-7">
          <span aria-hidden className="absolute bottom-2 left-[9px] top-2 w-px bg-line" />
          {[...groups.entries()].map(([year, events]) => (
            <section key={year} className="mb-6">
              <div className="relative mb-3">
                <span
                  aria-hidden
                  className="absolute -left-7 top-1.5 grid size-[19px] place-items-center rounded-full border-2 border-line bg-paper"
                />
                <h2 className="text-[13px] font-semibold tracking-wide text-ink-soft">{year}年</h2>
              </div>

              <div className="space-y-3">
                {events.map((event) => {
                  const emotion = event.emotion ? emotionMap[event.emotion] : null;
                  return (
                    <article
                      key={event.id}
                      className="relative rounded-[var(--radius-card)] border border-line bg-surface p-4"
                    >
                      <span
                        aria-hidden
                        className="absolute -left-[26px] top-6 size-3 rounded-full border-2 border-surface"
                        style={{ backgroundColor: emotion?.color ?? "#cbd0c8" }}
                      />
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-ink-faint">{formatDate(event.eventDate)}</p>
                          <h3 className="mt-0.5 text-[15px] font-semibold text-ink">{event.title}</h3>
                        </div>
                        <button
                          type="button"
                          aria-label={`${event.title}を編集`}
                          onClick={() => form.openForm(event)}
                          className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
                        >
                          <Pencil className="size-4" />
                        </button>
                      </div>

                      {event.description ? (
                        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{event.description}</p>
                      ) : null}

                      {event.impact ? (
                        <p className="mt-2 rounded-[var(--radius-soft)] bg-paper-deep px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                          いまへの影響：{event.impact}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {emotion ? (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${emotion.chip}`}>
                            <span aria-hidden className="mr-1">{emotion.emoji}</span>
                            {emotion.label}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] text-ink-soft">
                          {IMPORTANCE_LABELS[event.importance]}
                        </span>
                        {event.memberIds.map((id) => (
                          <span
                            key={id}
                            className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] text-ink-soft"
                          >
                            {memberName(data.members, id)}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="relative">
            <span
              aria-hidden
              className="absolute -left-7 top-1.5 grid size-[19px] place-items-center rounded-full border-2 border-sage bg-sage-soft"
            />
            <p className="text-[13px] font-medium text-sage-deep">いま</p>
          </div>
        </div>
      )}

      {sorted.length > 0 ? (
        <Button variant="outline" size="lg" className="w-full" onClick={() => form.openForm()}>
          <Plus /> 出来事を追加
        </Button>
      ) : null}

      <EventForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        members={data.members}
        event={form.target}
        onSave={(event) => save("events", event)}
        onDelete={(event) => setDeleting(event)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="この出来事を削除しますか？"
        description="タイムラインから消えます。元に戻すことはできません。"
        onConfirm={() => {
          if (deleting) remove("events", deleting.id);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}

function EventForm({
  open,
  onOpenChange,
  familyId,
  members,
  event,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  members: { id: string; name: string; avatar: string }[];
  event: FamilyEvent | null;
  onSave: (event: FamilyEvent) => void;
  onDelete: (event: FamilyEvent) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const [title, setTitle] = React.useState(event?.title ?? "");
  const [description, setDescription] = React.useState(event?.description ?? "");
  const [eventDate, setEventDate] = React.useState(event?.eventDate ?? todayInput());
  const [importance, setImportance] = React.useState<Scale>(event?.importance ?? 3);
  const [emotion, setEmotion] = React.useState<EmotionKey | null>(event?.emotion ?? null);
  const [impact, setImpact] = React.useState(event?.impact ?? "");
  const [memberIds, setMemberIds] = React.useState<string[]>(event?.memberIds ?? []);
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("短くて大丈夫です。何があったかを一言で入れてください。");
      return;
    }
    const ts = nowIso();
    onSave({
      id: event?.id ?? createId(),
      familyId,
      title: trimmed.slice(0, 80),
      description: trimOrNull(description),
      eventDate: eventDate || todayInput(),
      importance,
      emotion,
      impact: trimOrNull(impact),
      memberIds,
      createdAt: event?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={event ? "出来事を編集" : "出来事を追加"}
      description="うまくまとめようとしなくて大丈夫です。"
      footer={
        <div className="flex gap-2">
          {event ? (
            <Button
              variant="outline"
              size="lg"
              className="text-[#a86f6f]"
              onClick={() => {
                onDelete(event);
                onOpenChange(false);
              }}
            >
              削除
            </Button>
          ) : null}
          <Button size="lg" className="flex-1" onClick={submit}>
            保存する
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        <Field label="いつ" htmlFor="event-date">
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </Field>

        <Field label="出来事" htmlFor="event-title">
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：引っ越し / 進路の話"
            maxLength={80}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}

        <Field label="どんなことがあった？" htmlFor="event-description">
          <Textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </Field>

        <Field label="関係している人">
          <MultiMemberSelect members={members} value={memberIds} onChange={setMemberIds} />
        </Field>

        <Field label="そのときの気持ち" hint="ひとつだけ選べます。あとで変えられます。">
          <ChipSelect options={EMOTIONS} value={emotion} onChange={setEmotion} label="そのときの気持ち" columns="grid" />
        </Field>

        <Field label="自分の中での大きさ">
          <ScalePicker value={importance} onChange={setImportance} labels={IMPORTANCE_LABELS} name="出来事の大きさ" />
        </Field>

        <Field label="いまへの影響" htmlFor="event-impact" hint="今も続いていることがあれば。">
          <Textarea
            id="event-impact"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            placeholder="例：それ以来その話題を避けている"
            maxLength={500}
          />
        </Field>
      </div>
    </Sheet>
  );
}
