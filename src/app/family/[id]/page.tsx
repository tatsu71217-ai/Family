"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberForm } from "@/components/family/member-form";
import { emotionMap, moodMap, relationStatusMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { memberName, partnerId, relationsOf } from "@/lib/insights";
import type { MemberProfile } from "@/lib/types";
import { formatDate, nowIso, sortByDateDesc } from "@/lib/utils";

/** 主観と事実を分けるため、見出しと補助文はすべて「自分から見た」書き方にする。 */
const PROFILE_FIELDS: {
  key: keyof MemberProfile;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: "impression",
    label: "自分から見た印象",
    hint: "事実ではなく、あなたの目に映っていること。",
    placeholder: "自分から見ると、…",
  },
  {
    key: "imagined",
    label: "相手の立場として想像したこと",
    hint: "当たっていなくて大丈夫です。想像として書きます。",
    placeholder: "想像すると、…かもしれない",
  },
  {
    key: "values",
    label: "大切にしていそうなこと",
    hint: "そう見える、という範囲で。",
    placeholder: "…を大事にしていそう",
  },
  {
    key: "struggles",
    label: "苦手そうなこと",
    hint: "欠点の指摘ではなく、配慮したい点として。",
    placeholder: "…は苦手そう",
  },
  { key: "gratitude", label: "感謝していること", hint: "小さなことで大丈夫です。", placeholder: "…してくれたこと" },
  { key: "concerns", label: "気になっていること", hint: "解決しなくても、書くだけで整理になります。", placeholder: "…が気になっている" },
  { key: "wantToTalk", label: "話したいこと", hint: "いつか話せたらいい、くらいで。", placeholder: "落ち着いたら…について話したい" },
];

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, save } = useData();
  const form = useSheetForm<null>();

  if (!data) return null;
  const member = data.members.find((m) => m.id === params.id);

  if (!member) {
    return (
      <AppPage title="見つかりませんでした" back="/family">
        <EmptyState
          emoji="🍃"
          title="この人の情報は見つかりませんでした"
          description="削除されたか、URLが変わった可能性があります。"
          action={
            <Button asChild variant="outline">
              <Link href="/family">家族構成へ戻る</Link>
            </Button>
          }
        />
      </AppPage>
    );
  }

  const mood = moodMap[member.mood];
  const relations = relationsOf(data, member.id);
  const events = sortByDateDesc(
    data.events.filter((e) => e.memberIds.includes(member.id)),
    (e) => e.eventDate,
  ).slice(0, 4);
  const emotions = sortByDateDesc(
    data.emotions.filter((e) => e.memberId === member.id),
    (e) => e.loggedAt,
  ).slice(0, 4);
  const actions = data.actions.filter((a) => a.targetMemberId === member.id && a.status !== "done");
  const issues = data.issues.filter((i) => i.memberIds.includes(member.id) && !i.resolvedAt);

  function updateProfile(key: keyof MemberProfile, value: string) {
    if (!member) return;
    if (member.profile[key] === value) return;
    save("members", {
      ...member,
      profile: { ...member.profile, [key]: value },
      updatedAt: nowIso(),
    });
  }

  return (
    <AppPage
      title={member.name}
      subtitle={member.isSelf && member.relation !== "自分" ? `${member.relation}・自分` : member.relation}
      back="/family"
      action={
        <Button variant="ghost" size="icon" aria-label="この人を編集" onClick={() => form.openForm()}>
          <Pencil />
        </Button>
      }
    >
      <Card className="flex items-center gap-4">
        <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-full bg-paper-deep text-3xl">
          {member.avatar}
        </span>
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ${mood.chip}`}>
            <span aria-hidden className="mr-1">{mood.emoji}</span>
            {mood.label}
          </span>
          {member.notes ? (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{member.notes}</p>
          ) : (
            <p className="mt-2 text-[13px] text-ink-faint">{mood.hint}</p>
          )}
        </div>
      </Card>

      <SectionTitle>自分の言葉で整理する</SectionTitle>
      <Card className="space-y-5">
        <p className="text-[12px] leading-relaxed text-ink-faint">
          ここに書くことは「その人の本当の姿」ではありません。
          あなたから見えていることと、想像したことを分けて置いておく場所です。
        </p>
        {PROFILE_FIELDS.map((field) => (
          <ProfileField
            key={field.key}
            id={`profile-${field.key}`}
            label={field.label}
            hint={field.hint}
            placeholder={field.placeholder}
            value={member.profile[field.key]}
            onCommit={(value) => updateProfile(field.key, value)}
          />
        ))}
      </Card>

      <SectionTitle href="/map" linkLabel="関係マップ">
        この人との関係
      </SectionTitle>
      {relations.length ? (
        <div className="space-y-2">
          {relations.map((relationship) => {
            const other = partnerId(relationship, member.id);
            const option = relationStatusMap[relationship.status];
            return (
              <Card key={relationship.id} className="py-4">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-[14px] text-ink">
                    {member.name} ↔ {memberName(data.members, other)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${option.chip}`}>
                    <span aria-hidden className="mr-1">{option.emoji}</span>
                    {option.label}
                  </span>
                </div>
                {relationship.note ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{relationship.note}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          emoji="🧭"
          title="まだ関係が登録されていません"
          description="関係マップから、この人と誰かのつながりを描けます。"
          action={
            <Button asChild variant="outline">
              <Link href="/map">関係マップを開く</Link>
            </Button>
          }
        />
      )}

      {issues.length ? (
        <>
          <SectionTitle href="/issues">関わりのある課題</SectionTitle>
          <div className="space-y-2">
            {issues.map((issue) => (
              <Card key={issue.id} className="py-4">
                <CardTitle>{issue.title}</CardTitle>
                {issue.desiredState ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    本当は：{issue.desiredState}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {events.length ? (
        <>
          <SectionTitle href="/timeline">関わりのある出来事</SectionTitle>
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id} className="py-4">
                <p className="text-[12px] text-ink-faint">{formatDate(event.eventDate)}</p>
                <CardTitle className="mt-0.5">{event.title}</CardTitle>
                {event.impact ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{event.impact}</p>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {emotions.length ? (
        <>
          <SectionTitle href="/emotions">この人といるときの気持ち</SectionTitle>
          <Card className="space-y-3">
            {emotions.map((log) => {
              const option = emotionMap[log.emotion];
              return (
                <div key={log.id} className="flex gap-3">
                  <span aria-hidden className="text-lg">{option.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {option.label}
                      <span className="ml-2 text-[12px] font-normal text-ink-faint">
                        {formatDate(log.loggedAt)}
                      </span>
                    </p>
                    {log.context ? (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{log.context}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      ) : null}

      {actions.length ? (
        <>
          <SectionTitle href="/actions">この人に向けた小さな行動</SectionTitle>
          <div className="space-y-2">
            {actions.map((action) => (
              <Card key={action.id} className="py-4 text-[14px] text-ink">
                {action.title}
              </Card>
            ))}
          </div>
        </>
      ) : null}

      <MemberForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        member={member}
        hasSelf={data.members.some((m) => m.isSelf)}
        onSave={(next) => save("members", next)}
      />
    </AppPage>
  );
}

/** 入力を離れたタイミングだけ保存する（打っている途中で保存しない）。 */
function ProfileField({
  id,
  label,
  hint,
  placeholder,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  // 保存後に外側の値が変わったときだけ、描画中に合わせ直す
  const [draft, setDraft] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <p className="text-xs leading-relaxed text-ink-faint">{hint}</p>
      <Textarea
        id={id}
        value={draft}
        placeholder={placeholder}
        rows={2}
        maxLength={800}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft.trim())}
      />
    </div>
  );
}
