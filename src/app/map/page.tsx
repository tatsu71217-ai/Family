"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RelationMap } from "@/components/map/relation-map";
import { RelationshipForm } from "@/components/map/relationship-form";
import { RELATION_STATUSES, relationStatusMap } from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { memberName, partnerId, relationsOf } from "@/lib/insights";
import type { Relationship } from "@/lib/types";

export default function MapPage() {
  const { data, save, remove } = useData();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const form = useSheetForm<Relationship>();

  if (!data) return null;
  const { members, relationships } = data;
  const selected = members.find((m) => m.id === selectedId) ?? null;

  function openNew(defaultId?: string | null) {
    if (defaultId) setSelectedId(defaultId);
    form.openForm();
  }

  return (
    <AppPage
      title="関係マップ"
      subtitle="家族のつながりを、一目で見られる形にします。"
      action={
        members.length >= 2 ? (
          <Button variant="ghost" size="icon" aria-label="関係を追加" onClick={() => openNew(selectedId)}>
            <Plus />
          </Button>
        ) : null
      }
    >
      {members.length < 2 ? (
        <EmptyState
          emoji="🧭"
          title="関係を描くには、2人以上が必要です"
          description="家族構成から人を追加すると、ここにつながりが表示されます。"
          action={
            <Button asChild>
              <Link href="/family">家族を追加する</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RelationMap
            members={members}
            relationships={relationships}
            selectedId={selectedId}
            onSelectMember={setSelectedId}
            onSelectRelationship={(relationship) => form.openForm(relationship)}
            className="mx-auto aspect-[4/5] max-h-[70dvh] w-full md:max-w-[460px]"
          />

          <div className="flex flex-wrap gap-1.5 px-1">
            {RELATION_STATUSES.map((option) => (
              <span
                key={option.value}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${option.chip}`}
              >
                <span aria-hidden>{option.emoji}</span>
                {option.label}
              </span>
            ))}
          </div>

          {selected ? (
            <Card className="border-sage/40 bg-sage-soft/30">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-surface text-2xl">
                  {selected.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{selected.name}</p>
                  <p className="text-[12px] text-ink-faint">
                    {selected.relation}・関係 {relationsOf(data, selected.id).length}件
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/family/${selected.id}`}>プロフィールを見る</Link>
                </Button>
                <Button variant="soft" size="sm" onClick={() => openNew(selected.id)}>
                  <Plus /> 関係を追加
                </Button>
              </div>
            </Card>
          ) : (
            <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
              人をタップすると、その人のつながりだけが浮かび上がります。
              線の真ん中の丸をタップすると、関係を編集できます。
            </p>
          )}

          <SectionTitle>関係の一覧</SectionTitle>
          {relationships.length === 0 ? (
            <EmptyState
              emoji="🪢"
              title="まだ関係が登録されていません"
              description="「誰と誰が、いまどんな感じか」を1つずつ置いていきます。"
              action={<Button onClick={() => openNew()}>関係を追加</Button>}
            />
          ) : (
            <ul className="space-y-2">
              {relationships.map((relationship) => {
                const option = relationStatusMap[relationship.status];
                return (
                  <li key={relationship.id}>
                    <button
                      type="button"
                      onClick={() => form.openForm(relationship)}
                      className="w-full rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left transition-colors hover:bg-paper-deep/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-[14px] font-medium text-ink">
                          {memberName(members, relationship.memberAId)} ↔{" "}
                          {memberName(members, relationship.memberBId)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${option.chip}`}>
                          <span aria-hidden className="mr-1">{option.emoji}</span>
                          {option.label}
                        </span>
                      </div>
                      {relationship.note ? (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                          {relationship.note}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selected ? (
            <p className="px-1 text-[12px] text-ink-faint">
              {selected.name}とつながっているのは{" "}
              {relationsOf(data, selected.id)
                .map((r) => memberName(members, partnerId(r, selected.id)))
                .join("・") || "まだ誰もいません"}
              。
            </p>
          ) : null}
        </>
      )}

      <RelationshipForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        members={members}
        relationships={relationships}
        relationship={form.target}
        defaultMemberId={selectedId}
        onSave={(relationship) => save("relationships", relationship)}
        onDelete={(relationship) => remove("relationships", relationship.id)}
      />
    </AppPage>
  );
}
