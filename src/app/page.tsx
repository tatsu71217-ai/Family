"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Heart, Lightbulb, NotebookPen, Sparkles, Users } from "lucide-react";
import { AppPage, SectionTitle } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniTrend } from "@/components/charts/emotion-charts";
import { InstallHint } from "@/components/layout/install-hint";
import {
  FAMILY_MOODS,
  IMPACT_LABELS,
  actionStatusMap,
  emotionMap,
  moodMap,
} from "@/lib/constants";
import { useData } from "@/lib/store/provider";
import {
  emotionTrend,
  memberName,
  moodBreakdown,
  openIssues,
  pendingActions,
  recentEmotions,
  recentEvents,
  relationBreakdown,
  relationsOf,
} from "@/lib/insights";
import { cn, formatDate, formatRelative, nowIso } from "@/lib/utils";

export default function HomePage() {
  const { data, isDemo, save } = useData();

  if (!data) return null;

  const { members, relationships, family } = data;
  const moods = moodBreakdown(members);
  const relations = relationBreakdown(data);
  const events = recentEvents(data, 3);
  const issues = openIssues(data).slice(0, 2);
  const actions = pendingActions(data).slice(0, 3);
  const trend = emotionTrend(data.emotions, 42, 6);
  const recentEmotionCount = recentEmotions(data.emotions, 7).length;
  const isEmpty = members.length === 0;

  return (
    <AppPage title={family.name} subtitle={greeting()}>
      <InstallHint />

      {isDemo ? (
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-[var(--radius-soft)] bg-sand-soft px-4 py-3 text-[13px] text-[#96794f]"
        >
          <span aria-hidden>🧪</span>
          <span className="flex-1">
            いまはデモデータです。自分の記録を始めるには設定から空にできます。
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </Link>
      ) : null}

      {isEmpty ? (
        <EmptyState
          emoji="🗺️"
          title="ここから、家族の地図をつくります"
          description="まずは自分と、身近な家族をひとり追加してみてください。順番は気にしなくて大丈夫です。"
          action={
            <Button asChild size="lg">
              <Link href="/family">家族を追加する</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* 家族全体の状態 */}
          <Card>
            <CardTitle>家族の今の感じ</CardTitle>
            <CardDescription className="mt-1">
              これは診断結果ではなく、あなた自身が付けている目印です。
            </CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FAMILY_MOODS.map((mood) => {
                const count = moods.get(mood.value) ?? 0;
                return (
                  <div
                    key={mood.value}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-[var(--radius-soft)] px-3 py-3",
                      count ? mood.chip : "bg-paper-deep text-ink-faint",
                    )}
                  >
                    <span aria-hidden className="text-xl">
                      {mood.emoji}
                    </span>
                    <span className="text-[18px] font-semibold leading-none">{count}</span>
                    <span className="text-[11px] leading-tight">{mood.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 家族メンバー */}
          <SectionTitle href="/family">家族</SectionTitle>
          <div className="-mx-4 overflow-x-auto px-4 pb-1">
            <div className="flex gap-2.5">
              {members.map((member) => {
                const mood = moodMap[member.mood];
                return (
                  <Link
                    key={member.id}
                    href={`/family/${member.id}`}
                    className="flex w-[104px] shrink-0 flex-col items-center gap-1 rounded-[var(--radius-card)] border border-line bg-surface px-2 py-4 transition-colors hover:bg-paper-deep/60"
                  >
                    <span aria-hidden className="grid size-12 place-items-center rounded-full bg-paper-deep text-2xl">
                      {member.avatar}
                    </span>
                    <span className="mt-1 truncate text-[13px] font-semibold text-ink">{member.name}</span>
                    <span className="text-[11px] text-ink-faint">{member.relation}</span>
                    <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium", mood.chip)}>
                      {mood.emoji} {mood.label}
                    </span>
                  </Link>
                );
              })}
              <Link
                href="/family"
                className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-2 py-4 text-ink-faint transition-colors hover:bg-paper-deep/50"
              >
                <Users className="size-5" aria-hidden />
                <span className="text-[12px]">家族を追加</span>
              </Link>
            </div>
          </div>

          {/* 関係の状態 */}
          <SectionTitle href="/map" linkLabel="関係マップ">
            関係のようす
          </SectionTitle>
          <Card>
            {relationships.length === 0 ? (
              <div className="text-center">
                <p className="text-[13px] text-ink-soft">
                  まだ関係が描かれていません。2人を選んで、いまの感じを置いてみましょう。
                </p>
                <Button asChild variant="soft" size="sm" className="mt-3">
                  <Link href="/map">関係マップを開く</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {relations.map(({ status, count, option }) => {
                    const percent = Math.round((count / relationships.length) * 100);
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="w-[112px] shrink-0 text-[13px] text-ink">
                          <span aria-hidden className="mr-1">{option.emoji}</span>
                          {option.label}
                        </span>
                        <span aria-hidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-deep">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${percent}%`, backgroundColor: option.color }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right text-[12px] text-ink-faint">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
                  {members.length}人・{relationships.length}件の関係が登録されています。
                  {mostConnected(data)}
                </p>
              </>
            )}
          </Card>

          {/* 最近の変化 */}
          <SectionTitle href="/emotions" linkLabel="感情整理">
            最近の変化
          </SectionTitle>
          <Card>
            <MiniTrend data={trend} />
            <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
              {recentEmotionCount > 0
                ? `この1週間で ${recentEmotionCount} 件の気持ちを記録しました。`
                : "この1週間はまだ記録がありません。ひとつ選ぶだけでも大丈夫です。"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["joy", "tired", "anxiety", "gratitude"].map((key) => {
                const option = emotionMap[key as keyof typeof emotionMap];
                return (
                  <Button key={key} asChild variant="outline" size="sm">
                    <Link href="/emotions">
                      <span aria-hidden>{option.emoji}</span> {option.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* 最近の出来事 */}
          <SectionTitle href="/timeline">最近の出来事</SectionTitle>
          {events.length ? (
            <div className="space-y-2">
              {events.map((event) => {
                const emotion = event.emotion ? emotionMap[event.emotion] : null;
                return (
                  <Link
                    key={event.id}
                    href="/timeline"
                    className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:bg-paper-deep/60"
                  >
                    <span
                      aria-hidden
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: emotion?.color ?? "#cbd0c8" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] text-ink-faint">{formatDate(event.eventDate)}</span>
                      <span className="block truncate text-[14px] font-medium text-ink">{event.title}</span>
                      {event.memberIds.length ? (
                        <span className="block text-[12px] text-ink-faint">
                          {event.memberIds.map((id) => memberName(members, id)).join("・")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              emoji="🕰️"
              title="まだ出来事がありません"
              description="覚えていることを、ひとつ置いてみるところから。"
              action={
                <Button asChild variant="outline">
                  <Link href="/timeline">タイムラインを開く</Link>
                </Button>
              }
            />
          )}

          {/* 主な課題 */}
          <SectionTitle href="/issues">いま気にかかっていること</SectionTitle>
          {issues.length ? (
            <div className="space-y-2">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href="/issues"
                  className="block rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:bg-paper-deep/60"
                >
                  <p className="text-[14px] font-medium text-ink">{issue.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {IMPACT_LABELS[issue.impact]}
                    {issue.memberIds.length
                      ? `・${issue.memberIds.map((id) => memberName(members, id)).join("・")}`
                      : ""}
                  </p>
                  {issue.desiredState ? (
                    <p className="mt-2 rounded-[var(--radius-soft)] bg-sky-soft/60 px-3 py-2 text-[13px] leading-relaxed text-ink">
                      本当は：{issue.desiredState}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🧩"
              title="いま登録されている課題はありません"
              description="気になることが出てきたときに、状況として書き留められます。"
              action={
                <Button asChild variant="outline">
                  <Link href="/issues">課題整理を開く</Link>
                </Button>
              }
            />
          )}

          {/* 今週の小さなアクション */}
          <SectionTitle href="/actions">今週の小さなこと</SectionTitle>
          {actions.length ? (
            <div className="space-y-2">
              {actions.map((action) => {
                const option = actionStatusMap[action.status];
                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
                  >
                    <button
                      type="button"
                      aria-label={`「${action.title}」を実行済みにする`}
                      onClick={() =>
                        save("actions", { ...action, status: "done", updatedAt: nowIso() })
                      }
                      className={cn(
                        "mt-0.5 grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                        option.chip,
                      )}
                    >
                      <span aria-hidden>{option.emoji}</span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-relaxed text-ink">{action.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        {action.targetMemberId
                          ? `${memberName(members, action.targetMemberId)}へ`
                          : "相手は決めていません"}
                        {action.dueDate ? `・${formatDate(action.dueDate)}まで` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              <p className="px-1 text-[12px] text-ink-faint">
                できなかった日があっても大丈夫です。状態はいつでも戻せます。
              </p>
            </div>
          ) : (
            <EmptyState
              emoji="🌱"
              title="いま予定している行動はありません"
              description="「今日は一度だけ話を遮らず聞く」くらいの大きさで十分です。"
              action={
                <Button asChild variant="outline">
                  <Link href="/actions">行動を選ぶ</Link>
                </Button>
              }
            />
          )}
        </>
      )}

      {/* ほかの画面への導線 */}
      <SectionTitle>ほかの整理</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <QuickLink href="/insights" icon={Lightbulb} title="気づき" description="記録から見えること" />
        <QuickLink href="/timeline" icon={CalendarClock} title="出来事" description="時系列で見る" />
        <QuickLink href="/emotions" icon={Heart} title="感情整理" description="いまの気持ち" />
        <QuickLink href="/issues" icon={NotebookPen} title="課題整理" description="状況として書く" />
        <QuickLink href="/review" icon={Sparkles} title="振り返り" description="少しの変化を見る" />
        <QuickLink href="/actions" icon={Sparkles} title="行動" description="小さくやってみる" />
      </div>

      {data.reviews.length ? (
        <p className="px-1 pt-2 text-[12px] text-ink-faint">
          最後の振り返り：{formatRelative(data.reviews[data.reviews.length - 1].createdAt)}
        </p>
      ) : null}
    </AppPage>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:bg-paper-deep/60"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-sage-deep">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        <span className="block truncate text-[12px] text-ink-faint">{description}</span>
      </span>
    </Link>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "夜更かしの時間に、少しだけ整理しますか。";
  if (hour < 11) return "おはようございます。今日の分だけで大丈夫です。";
  if (hour < 18) return "こんにちは。気になることを置いていきましょう。";
  return "こんばんは。今日あったことを、ひとつだけでも。";
}

/** いちばん多くの人とつながっている人を、事実として一言添える。 */
function mostConnected(data: Parameters<typeof relationsOf>[0]): string {
  let best: { name: string; count: number } | null = null;
  for (const member of data.members) {
    const count = relationsOf(data, member.id).length;
    if (!best || count > best.count) best = { name: member.name, count };
  }
  if (!best || best.count === 0) return "";
  return `いちばん多くつながっているのは ${best.name} です。`;
}
