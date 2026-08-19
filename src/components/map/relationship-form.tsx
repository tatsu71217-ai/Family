"use client";

import * as React from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { ChipSelect } from "@/components/ui/chip-select";
import { RELATION_STATUSES } from "@/lib/constants";
import type { FamilyMember, RelationStatus, Relationship } from "@/lib/types";
import { createId, nowIso, trimOrNull } from "@/lib/utils";

export function RelationshipForm({
  open,
  onOpenChange,
  familyId,
  members,
  relationships,
  relationship,
  defaultMemberId,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  members: FamilyMember[];
  relationships: Relationship[];
  relationship: Relationship | null;
  defaultMemberId?: string | null;
  onSave: (relationship: Relationship) => void;
  onDelete?: (relationship: Relationship) => void;
}) {
  // 開くたびに親が key を変えて作り直す
  const initialA =
    relationship?.memberAId ??
    defaultMemberId ??
    members.find((m) => m.isSelf)?.id ??
    members[0]?.id ??
    "";
  const [memberA, setMemberA] = React.useState(initialA);
  const [memberB, setMemberB] = React.useState(
    relationship?.memberBId ?? members.find((m) => m.id !== initialA)?.id ?? "",
  );
  const [status, setStatus] = React.useState<RelationStatus>(relationship?.status ?? "normal");
  const [note, setNote] = React.useState(relationship?.note ?? "");
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    if (!memberA || !memberB) {
      setError("2人を選んでください。");
      return;
    }
    if (memberA === memberB) {
      setError("違う2人を選んでください。");
      return;
    }
    const duplicate = relationships.find(
      (r) =>
        r.id !== relationship?.id &&
        ((r.memberAId === memberA && r.memberBId === memberB) ||
          (r.memberAId === memberB && r.memberBId === memberA)),
    );
    if (duplicate) {
      setError("この2人の関係はすでに登録されています。そちらを編集してください。");
      return;
    }

    const ts = nowIso();
    onSave({
      id: relationship?.id ?? createId(),
      familyId,
      memberAId: memberA,
      memberBId: memberB,
      status,
      note: trimOrNull(note),
      createdAt: relationship?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={relationship ? "関係を編集" : "関係を追加"}
      description="いまの感じ方でかまいません。関係は変わっていくものとして扱います。"
      footer={
        <div className="flex gap-2">
          {relationship && onDelete ? (
            <Button
              variant="outline"
              size="lg"
              className="text-[#a86f6f]"
              onClick={() => {
                onDelete(relationship);
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="ひとり目" htmlFor="rel-a">
            <Select id="rel-a" value={memberA} onChange={(e) => setMemberA(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ふたり目" htmlFor="rel-b">
            <Select id="rel-b" value={memberB} onChange={(e) => setMemberB(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="いまの関係" hint="ぴったりの言葉がなければ「複雑」や「不明」で大丈夫です。">
          <ChipSelect options={RELATION_STATUSES} value={status} onChange={setStatus} label="いまの関係" />
        </Field>

        <Field label="メモ" htmlFor="rel-note" hint="そう感じる理由や、思い当たることがあれば。">
          <Textarea
            id="rel-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：会話は多いが、深い話はしていない"
            maxLength={500}
          />
        </Field>

        {error ? (
          <p role="alert" className="text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
