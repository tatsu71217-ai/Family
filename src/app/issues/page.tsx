"use client";

import * as React from "react";
import { Plus, Pencil, Check, RotateCcw, ArrowRight } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MultiMemberSelect } from "@/components/ui/chip-select";
import { ScalePicker } from "@/components/ui/scale-picker";
import { ConfirmDialog } from "@/components/ui/confirm";
import { FREQUENCY_LABELS, IMPACT_LABELS } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { memberName } from "@/lib/insights";
import type { FamilyAction, Issue, Scale } from "@/lib/types";
import { createId, nowIso, trimOrNull } from "@/lib/utils";

export default function IssuesPage() {
  const { data, save, remove } = useData();
  const form = useSheetForm<Issue>();
  const [deleting, setDeleting] = React.useState<Issue | null>(null);
  const [addedActionFor, setAddedActionFor] = React.useState<string | null>(null);

  if (!data) return null;

  const open = data.issues
    .filter((i) => !i.resolvedAt)
    .sort((a, b) => b.frequency * b.impact - a.frequency * a.impact);
  const settled = data.issues.filter((i) => i.resolvedAt);

  function toggleResolved(issue: Issue) {
    save("issues", {
      ...issue,
      resolvedAt: issue.resolvedAt ? null : nowIso(),
      updatedAt: nowIso(),
    });
  }

  function addToActions(issue: Issue) {
    if (!issue.nextAction?.trim() || !data) return;
    const ts = nowIso();
    const action: FamilyAction = {
      id: createId(),
      familyId: data.family.id,
      targetMemberId: issue.memberIds[0] ?? null,
      title: issue.nextAction.trim().slice(0, 120),
      dueDate: null,
      status: "todo",
      afterFeeling: null,
      reflection: null,
      createdAt: ts,
      updatedAt: ts,
    };
    save("actions", action);
    setAddedActionFor(issue.id);
    window.setTimeout(() => setAddedActionFor(null), 2600);
  }

  return (
    <AppPage
      title="課題整理"
      subtitle="人ではなく「状況」として並べます。誰が悪いかは決めません。"
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label="課題を追加"
          onClick={() => form.openForm()}
        >
          <Plus />
        </Button>
      }
    >
      {data.issues.length === 0 ? (
        <EmptyState
          emoji="🧩"
          title="まだ課題が登録されていません"
          description="「状況 → 気持ち → 本当はどうしたい → 小さな一歩」の順に整理していきます。"
          action={
            <Button onClick={() => form.openForm()}>
              <Plus /> 課題を追加
            </Button>
          }
        />
      ) : null}

      {open.map((issue) => (
        <article key={issue.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <div className="flex items-start gap-3">
            <h2 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-ink">{issue.title}</h2>
            <button
              type="button"
              aria-label={`${issue.title}を編集`}
              onClick={() => form.openForm(issue)}
              className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
            >
              <Pencil className="size-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] text-ink-soft">
              頻度：{FREQUENCY_LABELS[issue.frequency]}
            </span>
            <span className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] text-ink-soft">
              影響：{IMPACT_LABELS[issue.impact]}
            </span>
            {issue.memberIds.map((id) => (
              <span key={id} className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] text-ink-soft">
                {memberName(data.members, id)}
              </span>
            ))}
          </div>

          <dl className="mt-4 space-y-3">
            <Step label="起きていること" value={issue.description} />
            <Step label="困っていること" value={issue.trouble} />
            <Step label="本当はどうなりたいか" value={issue.desiredState} tone="hope" />
            <Step label="今できる小さな改善" value={issue.nextAction} tone="action" />
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {issue.nextAction?.trim() ? (
              <Button variant="soft" size="sm" onClick={() => addToActions(issue)}>
                {addedActionFor === issue.id ? (
                  <>
                    <Check /> 行動に入れました
                  </>
                ) : (
                  <>
                    <ArrowRight /> 行動リストに入れる
                  </>
                )}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => toggleResolved(issue)}>
              <Check /> ひと段落にする
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#a86f6f]"
              onClick={() => setDeleting(issue)}
            >
              削除
            </Button>
          </div>
        </article>
      ))}

      {settled.length ? (
        <>
          <SectionTitle>ひと段落したこと</SectionTitle>
          <div className="space-y-2">
            {settled.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-paper-deep/50 p-4"
              >
                <span className="min-w-0 flex-1 text-[14px] text-ink-soft">{issue.title}</span>
                <Button variant="ghost" size="sm" onClick={() => toggleResolved(issue)}>
                  <RotateCcw /> 戻す
                </Button>
              </div>
            ))}
          </div>
          <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
            「解決した」ではなく「いまは落ち着いている」という置き方にしています。
            また気になったら戻せます。
          </p>
        </>
      ) : null}

      {data.issues.length > 0 ? (
        <Button variant="outline" size="lg" className="w-full" onClick={() => form.openForm()}>
          <Plus /> 課題を追加
        </Button>
      ) : null}

      <IssueForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        members={data.members}
        issue={form.target}
        onSave={(issue) => save("issues", issue)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="この課題を削除しますか？"
        description="書いた内容も一緒に消えます。"
        onConfirm={() => {
          if (deleting) remove("issues", deleting.id);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}

function Step({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | null;
  tone?: "hope" | "action";
}) {
  if (!value?.trim()) return null;
  return (
    <div
      className={
        tone === "hope"
          ? "rounded-[var(--radius-soft)] bg-sky-soft/70 px-3 py-2.5"
          : tone === "action"
            ? "rounded-[var(--radius-soft)] bg-sage-soft/70 px-3 py-2.5"
            : "px-0"
      }
    >
      <dt className="text-[12px] font-medium text-ink-faint">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">{value}</dd>
    </div>
  );
}

function IssueForm({
  open,
  onOpenChange,
  familyId,
  members,
  issue,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  members: { id: string; name: string; avatar: string }[];
  issue: Issue | null;
  onSave: (issue: Issue) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const [title, setTitle] = React.useState(issue?.title ?? "");
  const [description, setDescription] = React.useState(issue?.description ?? "");
  const [trouble, setTrouble] = React.useState(issue?.trouble ?? "");
  const [desiredState, setDesiredState] = React.useState(issue?.desiredState ?? "");
  const [nextAction, setNextAction] = React.useState(issue?.nextAction ?? "");
  const [frequency, setFrequency] = React.useState<Scale>(issue?.frequency ?? 3);
  const [impact, setImpact] = React.useState<Scale>(issue?.impact ?? 3);
  const [memberIds, setMemberIds] = React.useState<string[]>(issue?.memberIds ?? []);
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("状況を一言で表す言葉を入れてください。");
      return;
    }
    const ts = nowIso();
    onSave({
      id: issue?.id ?? createId(),
      familyId,
      title: trimmed.slice(0, 80),
      description: trimOrNull(description),
      frequency,
      impact,
      trouble: trimOrNull(trouble),
      desiredState: trimOrNull(desiredState),
      nextAction: trimOrNull(nextAction),
      memberIds,
      resolvedAt: issue?.resolvedAt ?? null,
      createdAt: issue?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={issue ? "課題を編集" : "課題を追加"}
      description="人を主語にせず、状況を主語にして書いてみます。"
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          保存する
        </Button>
      }
    >
      <div className="space-y-5 py-2">
        <Field label="課題タイトル" htmlFor="issue-title" hint="例：「進路の話題になると会話が止まる」">
          <Input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="状況を一言で"
          />
        </Field>
        {error ? (
          <p role="alert" className="text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}

        <Field label="① 起きていること" htmlFor="issue-description" hint="見たこと・聞いたことを、そのまま。">
          <Textarea
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </Field>

        <Field label="② 困っていること" htmlFor="issue-trouble" hint="あなたが感じていること。">
          <Textarea
            id="issue-trouble"
            value={trouble}
            onChange={(e) => setTrouble(e.target.value)}
            maxLength={1000}
          />
        </Field>

        <Field label="③ 本当はどうなりたいか" htmlFor="issue-desired" hint="実現できるかどうかは、いま考えなくて大丈夫です。">
          <Textarea
            id="issue-desired"
            value={desiredState}
            onChange={(e) => setDesiredState(e.target.value)}
            maxLength={1000}
          />
        </Field>

        <Field label="④ 今できる小さな改善" htmlFor="issue-next" hint="ひとつだけ、今日できる大きさに。">
          <Textarea
            id="issue-next"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            maxLength={500}
            placeholder="例：結論を求めずに5分だけ話す"
          />
        </Field>

        <Field label="関係している人">
          <MultiMemberSelect members={members} value={memberIds} onChange={setMemberIds} />
        </Field>

        <Field label="どのくらいの頻度で起きる？">
          <ScalePicker value={frequency} onChange={setFrequency} labels={FREQUENCY_LABELS} name="頻度" />
        </Field>

        <Field label="どのくらい影響している？">
          <ScalePicker value={impact} onChange={setImpact} labels={IMPACT_LABELS} name="影響度" />
        </Field>

        <p className="text-[12px] leading-relaxed text-ink-faint">
          頻度と影響は、気にかかっている順に並べるためだけに使います。
          人を採点するためのものではありません。
        </p>
      </div>
    </Sheet>
  );
}
