import { emptyProfile, type FamilySnapshot, type SnapshotCollection } from "@/lib/types";

/* Supabase の行（snake_case）とアプリ内の型（camelCase）の相互変換。 */

export const TABLES: Record<SnapshotCollection | "family", string> = {
  family: "families",
  members: "family_members",
  relationships: "relationships",
  events: "events",
  issues: "issues",
  emotions: "emotions",
  actions: "actions",
  reviews: "reviews",
};

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const nullable = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);
const num = (v: unknown, fallback = 3): 1 | 2 | 3 | 4 | 5 => {
  const n = Number(v);
  if (n >= 1 && n <= 5) return Math.round(n) as 1 | 2 | 3 | 4 | 5;
  return fallback as 1 | 2 | 3 | 4 | 5;
};
const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const fromRow = {
  family: (r: Row): FamilySnapshot["family"] => ({
    id: str(r.id),
    name: str(r.name),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  members: (r: Row): FamilySnapshot["members"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    name: str(r.name),
    relation: str(r.relation),
    avatar: str(r.avatar) || "🙂",
    mood: (str(r.mood) || "thinking") as FamilySnapshot["members"][number]["mood"],
    notes: nullable(r.notes),
    profile: { ...emptyProfile(), ...((r.profile as object) ?? {}) },
    isSelf: Boolean(r.is_self),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  relationships: (r: Row): FamilySnapshot["relationships"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    memberAId: str(r.member_a_id),
    memberBId: str(r.member_b_id),
    status: (str(r.status) || "unknown") as FamilySnapshot["relationships"][number]["status"],
    note: nullable(r.note),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  events: (r: Row): FamilySnapshot["events"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    title: str(r.title),
    description: nullable(r.description),
    eventDate: str(r.event_date),
    importance: num(r.importance),
    emotion: (nullable(r.emotion) as FamilySnapshot["events"][number]["emotion"]) ?? null,
    impact: nullable(r.impact),
    memberIds: ids(r.member_ids),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  issues: (r: Row): FamilySnapshot["issues"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    title: str(r.title),
    description: nullable(r.description),
    frequency: num(r.frequency),
    impact: num(r.impact),
    trouble: nullable(r.trouble),
    desiredState: nullable(r.desired_state),
    nextAction: nullable(r.next_action),
    memberIds: ids(r.member_ids),
    resolvedAt: nullable(r.resolved_at),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  emotions: (r: Row): FamilySnapshot["emotions"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    memberId: nullable(r.member_id),
    emotion: (str(r.emotion) || "confused") as FamilySnapshot["emotions"][number]["emotion"],
    intensity: num(r.intensity),
    context: nullable(r.context),
    desiredResponse: nullable(r.desired_response),
    loggedAt: str(r.logged_at),
    createdAt: str(r.created_at),
  }),
  actions: (r: Row): FamilySnapshot["actions"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    targetMemberId: nullable(r.target_member_id),
    title: str(r.title),
    dueDate: nullable(r.due_date),
    status: (str(r.status) || "todo") as FamilySnapshot["actions"][number]["status"],
    afterFeeling: nullable(r.after_feeling),
    reflection: nullable(r.reflection),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
  reviews: (r: Row): FamilySnapshot["reviews"][number] => ({
    id: str(r.id),
    familyId: str(r.family_id),
    periodStart: str(r.period_start),
    periodEnd: str(r.period_end),
    wentWell: nullable(r.went_well),
    stillOnMind: nullable(r.still_on_mind),
    noticedChange: nullable(r.noticed_change),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }),
};

export function toRow(collection: SnapshotCollection | "family", item: Row, ownerId: string): Row {
  const base = { owner_id: ownerId };
  switch (collection) {
    case "family":
      return { ...base, id: item.id, name: item.name, created_at: item.createdAt, updated_at: item.updatedAt };
    case "members":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        name: item.name,
        relation: item.relation,
        avatar: item.avatar,
        mood: item.mood,
        notes: item.notes,
        profile: item.profile,
        is_self: item.isSelf,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    case "relationships":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        member_a_id: item.memberAId,
        member_b_id: item.memberBId,
        status: item.status,
        note: item.note,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    case "events":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        title: item.title,
        description: item.description,
        event_date: item.eventDate,
        importance: item.importance,
        emotion: item.emotion,
        impact: item.impact,
        member_ids: item.memberIds,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    case "issues":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        title: item.title,
        description: item.description,
        frequency: item.frequency,
        impact: item.impact,
        trouble: item.trouble,
        desired_state: item.desiredState,
        next_action: item.nextAction,
        member_ids: item.memberIds,
        resolved_at: item.resolvedAt,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    case "emotions":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        member_id: item.memberId,
        emotion: item.emotion,
        intensity: item.intensity,
        context: item.context,
        desired_response: item.desiredResponse,
        logged_at: item.loggedAt,
        created_at: item.createdAt,
      };
    case "actions":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        target_member_id: item.targetMemberId,
        title: item.title,
        due_date: item.dueDate,
        status: item.status,
        after_feeling: item.afterFeeling,
        reflection: item.reflection,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    case "reviews":
      return {
        ...base,
        id: item.id,
        family_id: item.familyId,
        period_start: item.periodStart,
        period_end: item.periodEnd,
        went_well: item.wentWell,
        still_on_mind: item.stillOnMind,
        noticed_change: item.noticedChange,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
  }
}
