"use client";

import * as React from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberCard } from "@/components/family/member-card";
import { MemberForm } from "@/components/family/member-form";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useData } from "@/lib/store/provider";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { relationsOf } from "@/lib/insights";
import type { FamilyMember } from "@/lib/types";

export default function FamilyPage() {
  const { data, save, remove } = useData();
  const form = useSheetForm<FamilyMember>();
  const [deleting, setDeleting] = React.useState<FamilyMember | null>(null);
  const [manage, setManage] = React.useState(false);

  if (!data) return null;
  const { members } = data;
  const hasSelf = members.some((m) => m.isSelf);

  return (
    <AppPage
      title="家族構成"
      subtitle="関わりのある人を、呼びやすい名前で並べます。"
      action={
        members.length ? (
          <Button variant="ghost" size="sm" onClick={() => setManage((v) => !v)}>
            {manage ? "完了" : "整理"}
          </Button>
        ) : null
      }
    >
      {members.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="まだ誰も登録されていません"
          description="まずは自分を追加すると、関係マップの中心ができます。"
          action={
            <Button onClick={() => form.openForm()}>
              <Plus /> 家族を追加
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {members.map((member) => (
            <div key={member.id} className="flex items-stretch gap-2">
              <MemberCard
                member={member}
                relationCount={relationsOf(data, member.id).length}
                className="flex-1"
              />
              {manage ? (
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`${member.name}を編集`}
                    onClick={() => form.openForm(member)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`${member.name}を削除`}
                    className="text-[#a86f6f]"
                    onClick={() => setDeleting(member)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {members.length > 0 ? (
        <Button variant="outline" size="lg" className="w-full" onClick={() => form.openForm()}>
          <Plus /> 家族を追加
        </Button>
      ) : null}

      <p className="px-1 pt-2 text-[12px] leading-relaxed text-ink-faint">
        ここに書くのは「その人がどういう人か」ではなく、
        あなたが整理しておきたいことだけで十分です。
      </p>

      <MemberForm
        key={form.formKey}
        open={form.open}
        onOpenChange={form.setOpen}
        familyId={data.family.id}
        member={form.target}
        hasSelf={hasSelf}
        onSave={(member) => save("members", member)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`${deleting?.name ?? ""}を削除しますか？`}
        description="この人に紐づく関係も一緒に消えます。出来事や感情の記録は残ります。"
        onConfirm={() => {
          if (deleting) remove("members", deleting.id);
          setDeleting(null);
        }}
      />
    </AppPage>
  );
}
