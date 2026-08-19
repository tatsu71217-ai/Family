/** アプリ全体で使うドメイン型。Supabase のテーブル定義とそのまま対応させている。 */

export type FamilyMood = "good" | "slight" | "careful" | "thinking";

export type RelationStatus =
  | "good"
  | "normal"
  | "distant"
  | "tense"
  | "complex"
  | "unknown";

export type EmotionKey =
  | "joy"
  | "sadness"
  | "anger"
  | "anxiety"
  | "lonely"
  | "relief"
  | "gratitude"
  | "tired"
  | "hope"
  | "confused";

export type ActionStatus = "todo" | "today" | "done" | "hold";

export type Scale = 1 | 2 | 3 | 4 | 5;

/** 人物プロフィール。すべて「自分から見た主観」として保持する。 */
export interface MemberProfile {
  /** 自分から見た印象 */
  impression: string;
  /** 相手の立場として想像したこと */
  imagined: string;
  /** 大切にしていそうなこと */
  values: string;
  /** 苦手そうなこと */
  struggles: string;
  /** 感謝していること */
  gratitude: string;
  /** 気になっていること */
  concerns: string;
  /** 話したいこと */
  wantToTalk: string;
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  relation: string;
  avatar: string;
  mood: FamilyMood;
  notes: string | null;
  profile: MemberProfile;
  isSelf: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  familyId: string;
  memberAId: string;
  memberBId: string;
  status: RelationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyEvent {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  eventDate: string;
  importance: Scale;
  emotion: EmotionKey | null;
  impact: string | null;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  frequency: Scale;
  impact: Scale;
  trouble: string | null;
  desiredState: string | null;
  nextAction: string | null;
  memberIds: string[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionLog {
  id: string;
  familyId: string;
  memberId: string | null;
  emotion: EmotionKey;
  intensity: Scale;
  context: string | null;
  desiredResponse: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface FamilyAction {
  id: string;
  familyId: string;
  targetMemberId: string | null;
  title: string;
  dueDate: string | null;
  status: ActionStatus;
  afterFeeling: string | null;
  reflection: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewNote {
  id: string;
  familyId: string;
  periodStart: string;
  periodEnd: string;
  wentWell: string | null;
  stillOnMind: string | null;
  noticedChange: string | null;
  createdAt: string;
  updatedAt: string;
}

/** アプリが保持する全データ。ローカル保存・Supabase 同期の両方でこの形を使う。 */
export interface FamilySnapshot {
  family: Family;
  members: FamilyMember[];
  relationships: Relationship[];
  events: FamilyEvent[];
  issues: Issue[];
  emotions: EmotionLog[];
  actions: FamilyAction[];
  reviews: ReviewNote[];
}

export type SnapshotCollection = Exclude<keyof FamilySnapshot, "family">;

export const emptyProfile = (): MemberProfile => ({
  impression: "",
  imagined: "",
  values: "",
  struggles: "",
  gratitude: "",
  concerns: "",
  wantToTalk: "",
});
