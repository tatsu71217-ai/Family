"use client";

import * as React from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ChipSelect } from "@/components/ui/chip-select";
import { AVATAR_PRESETS, FAMILY_MOODS, RELATION_PRESETS } from "@/lib/constants";
import { emptyProfile, type FamilyMember, type FamilyMood } from "@/lib/types";
import { createId, nowIso, trimOrNull, cn } from "@/lib/utils";

export function MemberForm({
  open,
  onOpenChange,
  familyId,
  member,
  hasSelf,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  member: FamilyMember | null;
  hasSelf: boolean;
  onSave: (member: FamilyMember) => void;
}) {
  // 開くたびに親が key を変えて作り直すため、初期値はここで決めれば足りる
  const [name, setName] = React.useState(member?.name ?? "");
  const [relation, setRelation] = React.useState(member?.relation ?? "母");
  const [avatar, setAvatar] = React.useState(member?.avatar ?? "🙂");
  const [mood, setMood] = React.useState<FamilyMood>(member?.mood ?? "thinking");
  const [notes, setNotes] = React.useState(member?.notes ?? "");
  const [isSelf, setIsSelf] = React.useState(member?.isSelf ?? false);
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("呼び名を入れてください。ニックネームでも大丈夫です。");
      return;
    }
    const ts = nowIso();
    onSave({
      id: member?.id ?? createId(),
      familyId,
      name: trimmed.slice(0, 40),
      relation: relation.trim().slice(0, 20) || "家族",
      avatar,
      mood,
      notes: trimOrNull(notes),
      profile: member?.profile ?? emptyProfile(),
      isSelf,
      createdAt: member?.createdAt ?? ts,
      updatedAt: ts,
    });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={member ? "家族を編集" : "家族を追加"}
      description="呼び名と続柄だけでも大丈夫です。あとから増やせます。"
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          保存する
        </Button>
      }
    >
      <div className="space-y-5 py-2">
        <Field label="呼び名" htmlFor="member-name">
          <Input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="母 / お姉ちゃん / たろう など"
            maxLength={40}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-[13px] text-[#a86f6f]">
            {error}
          </p>
        ) : null}

        <Field label="続柄" htmlFor="member-relation">
          <Select id="member-relation" value={relation} onChange={(e) => setRelation(e.target.value)}>
            {RELATION_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="アイコン" hint="写真は使いません。近い雰囲気のものをどうぞ。">
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {AVATAR_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`アイコン ${emoji}`}
                aria-pressed={avatar === emoji}
                onClick={() => setAvatar(emoji)}
                className={cn(
                  "grid aspect-square place-items-center rounded-[14px] border text-xl transition-colors",
                  avatar === emoji ? "border-sage bg-sage-soft" : "border-line bg-surface hover:bg-paper-deep",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </Field>

        <Field label="いまの感じ方" hint="診断ではなく、あなた自身の整理用のしるしです。あとで変えられます。">
          <ChipSelect options={FAMILY_MOODS} value={mood} onChange={setMood} label="いまの感じ方" />
        </Field>

        <Field label="メモ" htmlFor="member-notes" hint="覚えておきたいことがあれば。">
          <Textarea
            id="member-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例：平日は帰りが遅い"
            maxLength={500}
          />
        </Field>

        <label className="flex items-start gap-3 rounded-[var(--radius-soft)] bg-paper-deep px-4 py-3">
          <input
            type="checkbox"
            checked={isSelf}
            onChange={(e) => {
              setIsSelf(e.target.checked);
              // 「自分」にしたときは続柄もそろえておく（あとから変更できる）
              if (e.target.checked && relation === "母") setRelation("自分");
              if (!e.target.checked && relation === "自分") setRelation("母");
            }}
            disabled={hasSelf && !member?.isSelf}
            className="mt-1 size-4 accent-[#7fa88e]"
          />
          <span className="text-[13px] leading-relaxed text-ink-soft">
            この人を「自分」にする
            {hasSelf && !member?.isSelf ? (
              <span className="mt-0.5 block text-xs text-ink-faint">
                すでに「自分」が登録されています。変える場合はそちらを先に編集してください。
              </span>
            ) : (
              <span className="mt-0.5 block text-xs text-ink-faint">
                関係マップの中心に置かれます。
              </span>
            )}
          </span>
        </label>
      </div>
    </Sheet>
  );
}
