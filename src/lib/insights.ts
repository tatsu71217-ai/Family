import {
  EMOTION_TONE,
  emotionMap,
  relationStatusMap,
} from "./constants";
import type {
  EmotionKey,
  EmotionLog,
  FamilyMember,
  FamilySnapshot,
  Issue,
  RelationStatus,
} from "./types";
import { isWithinDays, sortByDateDesc } from "./utils";

/* ------------------------------------------------------------------
   入力されたデータから「構造」を読み取るための計算。
   ここでは善悪や正しさの判定はしない。数え方と並べ方だけを決める。
   ------------------------------------------------------------------ */

export function memberMap(members: FamilyMember[]): Map<string, FamilyMember> {
  return new Map(members.map((m) => [m.id, m]));
}

export function memberName(members: FamilyMember[], id: string | null | undefined): string {
  if (!id) return "全体";
  return members.find((m) => m.id === id)?.name ?? "不明な人";
}

export function selfMember(members: FamilyMember[]): FamilyMember | null {
  return members.find((m) => m.isSelf) ?? members[0] ?? null;
}

/** 特定の人に関わる関係だけを取り出す */
export function relationsOf(snapshot: FamilySnapshot, memberId: string) {
  return snapshot.relationships.filter(
    (r) => r.memberAId === memberId || r.memberBId === memberId,
  );
}

export function partnerId(relationship: { memberAId: string; memberBId: string }, memberId: string) {
  return relationship.memberAId === memberId ? relationship.memberBId : relationship.memberAId;
}

export function relationBetween(snapshot: FamilySnapshot, a: string, b: string) {
  return snapshot.relationships.find(
    (r) =>
      (r.memberAId === a && r.memberBId === b) || (r.memberAId === b && r.memberBId === a),
  );
}

/** 関係の状態の内訳（関係マップの凡例・ダッシュボードで使う） */
export function relationBreakdown(snapshot: FamilySnapshot) {
  const counts = new Map<RelationStatus, number>();
  for (const r of snapshot.relationships) {
    counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count, option: relationStatusMap[status] }))
    .sort((a, b) => b.count - a.count);
}

export function recentEvents(snapshot: FamilySnapshot, limit = 3) {
  return sortByDateDesc(snapshot.events, (e) => e.eventDate).slice(0, limit);
}

/** 気になり度（頻度 × 影響）の高い順。数値は優先順位づけのためだけに使う。 */
export function issueWeight(issue: Issue) {
  return issue.frequency * issue.impact;
}

export function openIssues(snapshot: FamilySnapshot) {
  return snapshot.issues
    .filter((i) => !i.resolvedAt)
    .sort((a, b) => issueWeight(b) - issueWeight(a));
}

export function pendingActions(snapshot: FamilySnapshot) {
  const order = { today: 0, todo: 1, hold: 2, done: 3 } as const;
  return snapshot.actions
    .filter((a) => a.status !== "done")
    .sort((a, b) => {
      const byStatus = order[a.status] - order[b.status];
      if (byStatus !== 0) return byStatus;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
}

export function recentEmotions(logs: EmotionLog[], days: number) {
  return logs.filter((l) => isWithinDays(l.loggedAt, days));
}

/** 感情の割合（円グラフ用） */
export function emotionDistribution(logs: EmotionLog[]) {
  const counts = new Map<EmotionKey, number>();
  for (const log of logs) counts.set(log.emotion, (counts.get(log.emotion) ?? 0) + 1);
  const total = logs.length || 1;
  return [...counts.entries()]
    .map(([emotion, count]) => ({
      key: emotion,
      name: emotionMap[emotion].label,
      emoji: emotionMap[emotion].emoji,
      value: count,
      color: emotionMap[emotion].color,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

export interface TrendPoint {
  label: string;
  /** あたたかい記録の強さの合計 */
  warm: number;
  /** 重く感じた記録の強さの合計 */
  heavy: number;
  count: number;
}

/**
 * 感情の時間変化。
 * 「良い / 悪い」ではなく「あたたかい / 重い」という言い方にして、評価を避ける。
 */
export function emotionTrend(logs: EmotionLog[], days = 42, buckets = 6): TrendPoint[] {
  const now = Date.now();
  const span = (days * 24 * 60 * 60 * 1000) / buckets;
  const start = now - days * 24 * 60 * 60 * 1000;

  const points: TrendPoint[] = Array.from({ length: buckets }, (_, i) => {
    const bucketEnd = new Date(start + span * (i + 1));
    return {
      label: `${bucketEnd.getMonth() + 1}/${bucketEnd.getDate()}`,
      warm: 0,
      heavy: 0,
      count: 0,
    };
  });

  for (const log of logs) {
    const t = new Date(log.loggedAt).getTime();
    if (Number.isNaN(t) || t < start || t > now) continue;
    const index = Math.min(buckets - 1, Math.floor((t - start) / span));
    const tone = EMOTION_TONE[log.emotion];
    points[index].count += 1;
    if (tone === "warm") points[index].warm += log.intensity;
    else if (tone === "heavy") points[index].heavy += log.intensity;
  }

  return points;
}

/** 家族全体の空気感。人ごとのステータスの内訳をそのまま返す（点数化しない）。 */
export function moodBreakdown(members: FamilyMember[]) {
  const counts = new Map<FamilyMember["mood"], number>();
  for (const m of members) counts.set(m.mood, (counts.get(m.mood) ?? 0) + 1);
  return counts;
}

export interface OrganizedSummary {
  situation: string[];
  emotions: string[];
  issues: string[];
  cherished: string[];
  nextSteps: string[];
}

/**
 * 入力内容の「整理」。
 * 診断・断定は行わず、書かれたことを並べ直して見せるだけにとどめる。
 * 外部サービスへは一切送信しない。
 */
export function organizeSummary(snapshot: FamilySnapshot): OrganizedSummary {
  const { members, relationships, events } = snapshot;
  const situation: string[] = [];

  if (members.length) {
    situation.push(`登録されている家族は ${members.length} 人です。`);
  }
  if (relationships.length) {
    const breakdown = relationBreakdown(snapshot);
    const top = breakdown[0];
    situation.push(
      `関係の記録は ${relationships.length} 件で、いちばん多いのは「${top.option.label}」です。`,
    );
  }
  const recent = recentEvents(snapshot, 1)[0];
  if (recent) {
    situation.push(`最後に記録した出来事は「${recent.title}」です。`);
  }
  if (events.length >= 3) {
    situation.push(`出来事は ${events.length} 件たまっていて、流れとして見られます。`);
  }

  const last30 = recentEmotions(snapshot.emotions, 30);
  const distribution = emotionDistribution(last30).slice(0, 3);
  const emotions = distribution.map(
    (d) => `${d.emoji} ${d.name}：直近30日で ${d.value} 回（${d.percent}%）`,
  );

  const issues = openIssues(snapshot)
    .slice(0, 3)
    .map((issue) => {
      const who = issue.memberIds.map((id) => memberName(members, id)).join("・");
      return who ? `${issue.title}（${who}）` : issue.title;
    });

  const cherished: string[] = [];
  for (const m of members) {
    if (m.profile.values.trim()) cherished.push(`${m.name}：${m.profile.values.trim()}`);
    if (m.profile.gratitude.trim()) cherished.push(`${m.name}に感謝：${m.profile.gratitude.trim()}`);
  }

  const nextSteps: string[] = [];
  for (const issue of openIssues(snapshot)) {
    if (issue.nextAction?.trim()) nextSteps.push(issue.nextAction.trim());
  }
  for (const action of pendingActions(snapshot)) {
    nextSteps.push(
      action.targetMemberId
        ? `${action.title}（${memberName(members, action.targetMemberId)}）`
        : action.title,
    );
  }

  return {
    situation,
    emotions,
    issues,
    cherished: cherished.slice(0, 5),
    nextSteps: [...new Set(nextSteps)].slice(0, 5),
  };
}

/** 振り返り期間の変化。増減を「良し悪し」ではなく事実として並べる。 */
export function reviewStats(snapshot: FamilySnapshot, days = 30) {
  const emotionsInPeriod = recentEmotions(snapshot.emotions, days);
  const previous = snapshot.emotions.filter(
    (l) => isWithinDays(l.loggedAt, days * 2) && !isWithinDays(l.loggedAt, days),
  );

  const tone = (logs: EmotionLog[]) => {
    let warm = 0;
    let heavy = 0;
    for (const l of logs) {
      if (EMOTION_TONE[l.emotion] === "warm") warm += 1;
      else if (EMOTION_TONE[l.emotion] === "heavy") heavy += 1;
    }
    return { warm, heavy };
  };

  const doneActions = snapshot.actions.filter(
    (a) => a.status === "done" && isWithinDays(a.updatedAt, days),
  );
  const eventsInPeriod = snapshot.events.filter((e) => isWithinDays(e.eventDate, days));

  return {
    days,
    emotions: emotionsInPeriod,
    emotionTone: tone(emotionsInPeriod),
    previousTone: tone(previous),
    doneActions,
    events: sortByDateDesc(eventsInPeriod, (e) => e.eventDate),
    issuesResolved: snapshot.issues.filter((i) => i.resolvedAt && isWithinDays(i.resolvedAt, days)),
  };
}
