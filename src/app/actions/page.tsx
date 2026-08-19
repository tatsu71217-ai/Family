"use client";

import * as React from "react";
import { Plus, Pencil, Sparkles } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ChipSelect } from "@/components/ui/chip-select";
import { ConfirmDialog } from "@/components/ui/confirm";
import { ACTION_STATUSES, ACTION_SUGGESTIONS, actionStatusMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { memberName } from "@/lib/insights";
import type { ActionStatus, FamilyAction } from "@/lib/types";
import { cn, createId, formatDate, nowIso, trimOrNull } from "@/lib/utils";

const GROUPS: { status: ActionStatus; title: string }[] = [
  { status: "today", title: "今日やる" },
  { status: "todo", title: "これから" },
  { status: "hold", title: "保留" },
  { status: "done", title: "実行済み" },
];

export default function ActionsPage() {
  const { data, save, remove } = useData();
  const form = useSheetForm<{ action: FamilyAction | null; presetTitle: string | null }>();
  const [deleting, setDeleting] = React.useState<FamilyAction | null>(null);

  if (!data) return null;

  function openNew(title?: string) {
    form.openForm({ action: null, presetTitle: title ?? null });
  }

  function cycleStatus(action: FamilyAction) {
    const order: ActionStatus[] = ["todo", "today", "done", "hold"];
    const next = order[(order.indexOf(action.status) + 1) % order.length];
    save("actions", { ...action, status: next, updatedAt: nowIso() });
  }

  return (
    <AppPage
      title="改善アクション"
      subtitle="家族を変える大きな目標ではなく、今日できる小さなことに落とします。"
      action={
        <Button variant="ghost" size="icon" aria-label="行動を追加" onClick={() => openNew()}>
          <Plus />
        </Button>
      }
    >
      {data.actions.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="まだ行動がありません"
          description="うまくいかなくても構いません。やってみた記録が残るだけで十分です。"
          action={<Button onClick={() => openNew()}>行動を追加</Button>}
        />
      ) : null}

      {GROUPS.map(({ status, title }) => {
        const items = data.actions.filter((a) => a.status === status);
        if (!items.length) return null;
        const option = actionStatusMap[status];
        return (
          <section key={status}>
            <SectionTitle>
              {option.emoji} {title}（{items.length}）
            </SectionTitle>
            <div className="space-y-2">
              {items.map((action) => (
                <article
                  key={action.id}
                  className={cn(
                    "rounded-[var(--radius-card)] border border-line bg-surface p-4",
                    status === "done" && "bg-paper-deep/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => cycleStatus(action)}
                      aria-label={`状態を変える（いまは${option.label}）`}
                      className={cn(
                        "mt-0.5 grid size-10 shrink-0 place-items-center rounded-full text-base transition-colors",
                        option.chip,
                      )}
                    >
                      <span aria-hidden>{option.emoji}</span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[14px] leading-relaxed text-ink",
                          status === "done" && "text-ink-soft",
                        )}
                      >
                        {action.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] text-ink-faint">
                        {action.targetMemberId ? (
                          <span>{memberName(data.members, action.targetMemberId)}へ</span>
                        ) : null}
                        {action.dueDate ? <span>· {formatDate(action.dueDate)}まで</span> : null}
                      </p>

                      {action.afterFeeling ? (
                        <p className="mt-2 rounded-[var(--radius-soft)] bg-sage-soft/60 px-3 py-2 text-[13px] leading-relaxed text-ink">
                          やってみて：{action.afterFeeling}
                        </p>
                      ) : null}
                      {action.reflection ? (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                          {action.reflection}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      aria-label="この行動を編集"
                      onClick={() => form.openForm({ action, presetTitle: null })}
                      className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <SectionTitle>小さな行動の例</SectionTitle>
      <Card>
        <CardTitle>迷ったときは、ここから</CardTitle>
        <CardDescription className="mt-1">
          やらなくても大丈夫です。「できそう」と思えたものだけ。
        </CardDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTION_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => openNew(suggestion)}
              className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] text-ink-soft transition-colors hover:bg-sage-soft hover:text-sage-deep"
            >
              <Sparkles className="mr-1 inline size-3.5" aria-hidden />
              {suggestion}
            </button>
          ))}
        </div>
      </Card>

      {data.actions.length > 0 ? (
        <Button variant="outline" size="lg" className="w-full" onClick={() => openNew()}>
          <Plus /> 行動を追加
        </Button>
      ) : null}

      <ActionForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        members={data.members}
        action={form.target?.action ?? null}
        presetTitle={form.target?.presetTitle ?? null}
        onSave={(action) => save("actions", action)}
        onDelete={(action) => setDeleting(action)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="この行動を削除しますか？"
        onConfirm={() => {
          if (deleting) remove("actions", deleting.id);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}

function ActionForm({
  open,
  onOpenChange,
  familyId,
  members,
  action,
  presetTitle,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  members: { id: string; name: string; avatar: string }[];
  action: FamilyAction | null;
  presetTitle: string | null;
  onSave: (action: FamilyAction) => void;
  onDelete: (action: FamilyAction) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const [title, setTitle] = React.useState(action?.title ?? presetTitle ?? "");
  const [targetMemberId, setTargetMemberId] = React.useState(action?.targetMemberId ?? "");
  const [dueDate, setDueDate] = React.useState(action?.dueDate ?? "");
  const [status, setStatus] = React.useState<ActionStatus>(action?.status ?? "todo");
  const [afterFeeling, setAfterFeeling] = React.useState(action?.afterFeeling ?? "");
  const [reflection, setReflection] = React.useState(action?.reflection ?? "");
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("やってみることを、一文で入れてください。");
      return;
    }
    const ts = nowIso();
    onSave({
      id: action?.id ?? createId(),
      familyId,
      targetMemberId: targetMemberId || null,
      title: trimmed.slice(0, 120),
      dueDate: dueDate || null,
      status,
      afterFeeling: trimOrNull(afterFeeling),
      reflection: trimOrNull(reflection),
      createdAt: action?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={action ? "行動を編集" : "行動を追加"}
      description="小さいほど続きます。5分で終わることでも十分です。"
      footer={
        <div className="flex gap-2">
          {action ? (
            <Button
              variant="outline"
              size="lg"
              className="text-[#a86f6f]"
              onClick={() => {
                onDelete(action);
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
        <Field label="やってみること" htmlFor="action-title">
          <Input
            id="action-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="例：今日は一度だけ話を遮らず聞く"
          />
        </Field>
        {error ? (
          <p role="alert" className="text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}

        <Field label="誰に向けて？" htmlFor="action-target">
          <Select
            id="action-target"
            value={targetMemberId}
            onChange={(e) => setTargetMemberId(e.target.value)}
          >
            <option value="">特に決めない</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="いつまで" htmlFor="action-due" hint="決めなくても大丈夫です。">
          <Input id="action-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label="いまの状態">
          <ChipSelect options={ACTION_STATUSES} value={status} onChange={setStatus} label="いまの状態" />
        </Field>

        {(action || status === "done") && (
          <>
            <Field label="やってみてどう感じた？" htmlFor="action-feeling">
              <Textarea
                id="action-feeling"
                value={afterFeeling}
                onChange={(e) => setAfterFeeling(e.target.value)}
                maxLength={500}
                placeholder="うまくいかなかった、でも大丈夫です"
              />
            </Field>

            <Field label="気づいたこと" htmlFor="action-reflection">
              <Textarea
                id="action-reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                maxLength={500}
              />
            </Field>
          </>
        )}
      </div>
    </Sheet>
  );
}
