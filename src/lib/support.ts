import { EMOTION_TONE, emotionMap, relationStatusMap } from "./constants";
import {
  emotionDistribution,
  issueWeight,
  memberName,
  openIssues,
  pendingActions,
  recentEmotions,
  relationsOf,
} from "./insights";
import type {
  FamilyMember,
  FamilySnapshot,
  MemberProfile,
} from "./types";
import { isWithinDays, sortByDateDesc } from "./utils";

/* ------------------------------------------------------------------
   気づき・問いかけ・言い換え・行動提案。

   すべて端末の中の記録だけから組み立てる。外部サービスへは送信しない。
   相談チャットではなく、助言でもない。断定せず、材料を並べるだけにとどめる。
   ------------------------------------------------------------------ */

export interface Insight {
  id: string;
  /** 見出し。断定形にしない */
  title: string;
  /** 補足。何をもとにそう見えるのかを必ず添える */
  body: string;
  /** 記録の数え上げではなく推測を含むか（バッジ表示の判定に使う） */
  inferred: boolean;
  memberId?: string | null;
  link?: { label: string; href: string };
}

const DAY = 24 * 60 * 60 * 1000;

/* --- ① 気づきの提示 ------------------------------------------------ */

export function buildInsights(snapshot: FamilySnapshot): Insight[] {
  const insights: Insight[] = [];
  const { members, emotions, events, actions, relationships } = snapshot;

  // 記録が途絶えている人
  for (const member of members) {
    if (member.isSelf) continue;
    const touched = [
      ...emotions.filter((e) => e.memberId === member.id).map((e) => e.loggedAt),
      ...events.filter((e) => e.memberIds.includes(member.id)).map((e) => e.eventDate),
      ...actions.filter((a) => a.targetMemberId === member.id).map((a) => a.updatedAt),
    ];
    const last = sortByDateDesc(touched.map((t) => ({ t })), (x) => x.t)[0]?.t;
    if (!last) {
      if (relationsOf(snapshot, member.id).length > 0) {
        insights.push({
          id: `silent-${member.id}`,
          title: `${member.name}についての記録は、まだ入っていないようです`,
          body: "関係は登録されていますが、出来事や気持ちの記録はありません。書くことが思いつかないのも、ひとつの状態です。",
          inferred: false,
          memberId: member.id,
        });
      }
      continue;
    }
    const days = Math.floor((Date.now() - new Date(last).getTime()) / DAY);
    if (days >= 14) {
      insights.push({
        id: `quiet-${member.id}`,
        title: `この${days}日、${member.name}に関する記録が途絶えています`,
        body: "落ち着いている時期なのかもしれませんし、書きにくい時期なのかもしれません。どちらでも構いません。",
        inferred: true,
        memberId: member.id,
      });
    }
  }

  // 出来事のあとに、重い記録が続いていないか
  for (const event of sortByDateDesc(events, (e) => e.eventDate).slice(0, 6)) {
    const start = new Date(event.eventDate).getTime();
    if (Number.isNaN(start)) continue;
    const after = emotions.filter((log) => {
      const t = new Date(log.loggedAt).getTime();
      return t >= start && t <= start + 7 * DAY;
    });
    if (after.length < 2) continue;
    const heavy = after.filter((log) => EMOTION_TONE[log.emotion] === "heavy").length;
    if (heavy >= 2 && heavy / after.length >= 0.6) {
      insights.push({
        id: `after-event-${event.id}`,
        title: `「${event.title}」のあと、重く感じた記録が続いていたようです`,
        body: `その後の1週間に ${after.length} 件の記録があり、そのうち ${heavy} 件が重い側でした。出来事と気持ちがつながっていることがあります。`,
        inferred: true,
        link: { label: "タイムラインを見る", href: "/timeline" },
      });
    }
  }

  // 関係は気になるのに、気持ちが記録されていない相手
  for (const relationship of relationships) {
    if (!["tense", "complex", "distant"].includes(relationship.status)) continue;
    for (const id of [relationship.memberAId, relationship.memberBId]) {
      const member = members.find((m) => m.id === id);
      if (!member || member.isSelf) continue;
      const logged = emotions.some((log) => log.memberId === member.id);
      if (logged) continue;
      insights.push({
        id: `no-emotion-${relationship.id}-${member.id}`,
        title: `${member.name}との関係は「${relationStatusMap[relationship.status].label}」ですが、気持ちの記録はまだありません`,
        body: "言葉にしにくい相手ほど、後回しになりやすいところです。ひとつ選ぶだけでも構いません。",
        inferred: true,
        memberId: member.id,
        link: { label: "気持ちを記録する", href: "/emotions" },
      });
    }
  }

  // 感謝が集まっている相手
  const gratitudeByMember = new Map<string, number>();
  for (const log of emotions) {
    if (log.emotion !== "gratitude" || !log.memberId) continue;
    gratitudeByMember.set(log.memberId, (gratitudeByMember.get(log.memberId) ?? 0) + 1);
  }
  for (const [memberId, count] of gratitudeByMember) {
    if (count < 2) continue;
    insights.push({
      id: `gratitude-${memberId}`,
      title: `${memberName(members, memberId)}への感謝が ${count} 件たまっています`,
      body: "書いたままになっているものがあれば、ひとつだけ言葉にしてみる、という選び方もできます。",
      inferred: false,
      memberId,
      link: { label: "行動にする", href: "/actions" },
    });
  }

  // 課題に何度も出てくる相手（人を責める方向にならないよう、状況の偏りとして書く）
  const issueByMember = new Map<string, number>();
  for (const issue of openIssues(snapshot)) {
    for (const id of issue.memberIds) {
      issueByMember.set(id, (issueByMember.get(id) ?? 0) + 1);
    }
  }
  for (const [memberId, count] of issueByMember) {
    if (count < 2) continue;
    insights.push({
      id: `issue-focus-${memberId}`,
      title: `いま気にかかっていることの ${count} 件が、${memberName(members, memberId)}との場面に集まっています`,
      body: "その人に原因がある、という意味ではありません。同じ場面が繰り返されている、という見え方です。",
      inferred: true,
      memberId,
      link: { label: "課題を見る", href: "/issues" },
    });
  }

  // 「本当はどうなりたいか」が空のままの課題
  const withoutDesire = openIssues(snapshot).filter((i) => !i.desiredState?.trim());
  if (withoutDesire.length) {
    insights.push({
      id: "issues-without-desire",
      title: `${withoutDesire.length} 件の課題に「本当はどうなりたいか」が書かれていません`,
      body: "困っていることは書けても、望みのほうは言葉にしにくいことがあります。埋めなくても構いません。",
      inferred: false,
      link: { label: "課題を開く", href: "/issues" },
    });
  }

  // あたたかい記録と重い記録の移り変わり
  const last30 = recentEmotions(emotions, 30);
  const prev30 = emotions.filter((l) => isWithinDays(l.loggedAt, 60) && !isWithinDays(l.loggedAt, 30));
  if (last30.length >= 3 && prev30.length >= 3) {
    const warmRatio = (logs: typeof emotions) =>
      logs.filter((l) => EMOTION_TONE[l.emotion] === "warm").length / logs.length;
    const now = warmRatio(last30);
    const before = warmRatio(prev30);
    if (Math.abs(now - before) >= 0.2) {
      const up = now > before;
      insights.push({
        id: "tone-shift",
        title: up
          ? "この1か月は、あたたかく感じた記録の割合が増えているようです"
          : "この1か月は、重く感じた記録の割合が増えているようです",
        body: `前の1か月は ${Math.round(before * 100)}%、この1か月は ${Math.round(now * 100)}% があたたかい側の記録でした。良し悪しではなく、量の移り変わりとして見ています。`,
        inferred: true,
        link: { label: "振り返りを見る", href: "/review" },
      });
    }
  }

  // よく出てくる気持ち
  const top = emotionDistribution(last30)[0];
  if (top && last30.length >= 4 && top.percent >= 40) {
    insights.push({
      id: `dominant-${top.key}`,
      title: `この1か月は「${top.name}」の記録が多めです`,
      body: `${last30.length} 件のうち ${top.value} 件（${top.percent}%）でした。ひとつの気持ちが続くときは、それだけ長く関わっているということかもしれません。`,
      inferred: true,
      link: { label: "感情整理へ", href: "/emotions" },
    });
  }

  // やってみた行動のあとの変化
  const doneRecently = actions.filter((a) => a.status === "done" && isWithinDays(a.updatedAt, 30));
  if (doneRecently.length) {
    const withFeeling = doneRecently.filter((a) => a.afterFeeling?.trim()).length;
    insights.push({
      id: "actions-done",
      title: `この1か月に ${doneRecently.length} 件の小さな行動を実行しています`,
      body:
        withFeeling > 0
          ? `そのうち ${withFeeling} 件には、やってみたあとの気持ちが書かれています。うまくいったかどうかとは別に、動いた記録が残っています。`
          : "やってみたあとの気持ちは、まだ書かれていません。書かなくても構いません。",
      inferred: false,
      link: { label: "行動を見る", href: "/actions" },
    });
  }

  // 気にかかりの強い課題に、次の一歩がない
  const heavyIssueWithoutStep = openIssues(snapshot).find(
    (i) => issueWeight(i) >= 12 && !i.nextAction?.trim(),
  );
  if (heavyIssueWithoutStep) {
    insights.push({
      id: `no-step-${heavyIssueWithoutStep.id}`,
      title: `「${heavyIssueWithoutStep.title}」には、まだ小さな一歩が置かれていません`,
      body: "大きく解決しようとしなくて大丈夫です。今日できる大きさのことだけを置く場所です。",
      inferred: false,
      link: { label: "課題を開く", href: "/issues" },
    });
  }

  // 並べすぎると読む気力を奪うので、上から少しだけにする
  return insights.slice(0, 6);
}

/* --- ② 内省の問いかけ ---------------------------------------------- */

export interface ReflectivePrompt {
  id: string;
  question: string;
  /** なぜこの問いが出てきたか */
  because: string;
  memberId?: string | null;
  /** 答えを書き留める先。指定が無ければ、書き留めずに考えるだけ */
  saveTo?: { memberId: string; field: keyof MemberProfile; fieldLabel: string };
}

const GENERAL_PROMPTS: { id: string; question: string; because: string }[] = [
  {
    id: "friend-view",
    question: "もし同じことが友人に起きていたら、その人にどう声をかけますか？",
    because: "自分のことだけは、厳しく見てしまうことがあります。",
  },
  {
    id: "small-ok",
    question: "この1週間で、うまくいかなかったけれど「まあいいか」と思えたことはありますか？",
    because: "できたこと以外にも、置いておけたことがあります。",
  },
  {
    id: "own-need",
    question: "いま、あなた自身が本当はしてほしいことは何ですか？",
    because: "相手のことを考えるほど、自分の望みが後ろに下がりやすいためです。",
  },
  {
    id: "unchanged",
    question: "この数年で変わっていない、家族の良いところはありますか？",
    because: "変わった部分ばかりが目につくときがあります。",
  },
];

export function buildPrompts(snapshot: FamilySnapshot): ReflectivePrompt[] {
  const prompts: ReflectivePrompt[] = [];
  const { members } = snapshot;

  const needsPerspective = members.filter(
    (m) => !m.isSelf && !m.profile.imagined.trim(),
  );
  for (const member of needsPerspective.slice(0, 1)) {
    prompts.push({
      id: `perspective-${member.id}`,
      question: `${member.name}は、そのときどんな状況だったと思いますか？`,
      because: "「相手の立場として想像したこと」がまだ空欄です。当たっていなくて構いません。",
      memberId: member.id,
      saveTo: { memberId: member.id, field: "imagined", fieldLabel: "相手の立場として想像したこと" },
    });
  }

  const needsGratitude = members.filter((m) => !m.isSelf && !m.profile.gratitude.trim());
  for (const member of needsGratitude.slice(0, 1)) {
    prompts.push({
      id: `gratitude-${member.id}`,
      question: `${member.name}に、小さく感謝していることはありますか？`,
      because: "大きなことでなくて構いません。思い出せなければ、それでも構いません。",
      memberId: member.id,
      saveTo: { memberId: member.id, field: "gratitude", fieldLabel: "感謝していること" },
    });
  }

  const tense = snapshot.relationships.find((r) => r.status === "tense" || r.status === "complex");
  if (tense) {
    const other =
      members.find((m) => m.id === tense.memberAId && !m.isSelf) ??
      members.find((m) => m.id === tense.memberBId && !m.isSelf);
    if (other && !other.profile.wantToTalk.trim()) {
      prompts.push({
        id: `talk-${other.id}`,
        question: `落ち着いているときになら、${other.name}と何について話してみたいですか？`,
        because: "今すぐ話す必要はありません。話題だけ決めておく、という使い方ができます。",
        memberId: other.id,
        saveTo: { memberId: other.id, field: "wantToTalk", fieldLabel: "話したいこと" },
      });
    }
  }

  const rotation = Math.floor(Date.now() / (3 * DAY)) % GENERAL_PROMPTS.length;
  prompts.push({ ...GENERAL_PROMPTS[rotation] });

  return prompts;
}

/* --- ③ 言い換えの提案 ---------------------------------------------- */

export interface ReframeNote {
  found: string;
  why: string;
  alternatives: string[];
}

export interface ReframeResult {
  /** 元の言葉。ここは絶対に書き換えない */
  original: string;
  /** 言い換えを考えたほうがよさそうな表現 */
  notes: ReframeNote[];
  /** 相手を主語にした書き方が含まれていたか */
  hasBlaming: boolean;
}

const RULES: { pattern: RegExp; why: string; alternatives: string[]; blaming?: boolean }[] = [
  {
    pattern: /いつも|毎回/g,
    why: "そうでなかった時を見えなくしてしまうことがあります。いつのことだったかを書くほうが伝わります。",
    alternatives: ["このあいだは", "先週は", "何度か"],
  },
  {
    pattern: /絶対に|絶対/g,
    why: "強く言い切ると、相手が中身を受け取る前に身構えてしまうことがあります。",
    alternatives: ["できれば", "できるかぎり"],
  },
  {
    pattern: /全然|まったく|一度も/g,
    why: "全否定に聞こえる言葉です。程度をそのまま書くほうが、実際の困りごとが伝わります。",
    alternatives: ["あまり", "思っていたより少なく"],
  },
  {
    pattern: /なんで|どうして|なぜ/g,
    why: "理由を尋ねているつもりでも、問い詰める形に聞こえやすい言い方です。",
    alternatives: ["どんな事情だったのか聞きたい", "そのときのことを教えてほしい"],
  },
  {
    pattern: /べきだ|べきです|べき/g,
    why: "正しさの話になりやすく、相手が反論の姿勢に入りやすくなります。",
    alternatives: ["してもらえると助かる", "こうしてもらえたら嬉しい"],
  },
  {
    pattern: /ひどい|最低|勝手|自分勝手|無責任|だらしない/g,
    why: "人柄への評価は、伝えたい中身より先に届いてしまいます。何が起きて、どう感じたかに分けると届きやすくなります。",
    alternatives: ["つらかった", "こたえた", "戸惑った"],
  },
  {
    pattern: /あなたは|あなたが|お前は|君は/g,
    why: "相手を主語にすると、責める形になりやすいところです。「私は」から始めると、事実と気持ちを分けられます。",
    alternatives: ["私は", "私としては"],
    blaming: true,
  },
  {
    pattern: /普通は|常識的に|当たり前/g,
    why: "「普通」は、どちらが正しいかの争いに変わりやすい言葉です。",
    alternatives: ["私の感覚では", "私は"],
  },
  {
    pattern: /どうせ|しょせん/g,
    why: "あきらめの言葉は、相手より先に自分の選択肢を狭めてしまうことがあります。",
    alternatives: ["いまのところは", "今回は"],
  },
];

/**
 * 元の記録は一切変更しない。
 * 機械的に文を書き換えると日本語として壊れるため、置き換えた文章は作らない。
 * 「どの表現が引っかかりやすいか」と「言い換えの候補」だけを示し、
 * 実際の言い直しは本人の言葉で行ってもらう。
 */
export function reframe(original: string): ReframeResult {
  const notes: ReframeNote[] = [];
  let hasBlaming = false;

  for (const rule of RULES) {
    const matches = original.match(rule.pattern);
    if (!matches) continue;
    if (rule.blaming) hasBlaming = true;
    notes.push({
      found: [...new Set(matches)].join("・"),
      why: rule.why,
      alternatives: rule.alternatives,
    });
  }

  return { original, notes, hasBlaming };
}

/** 文末の句点を落とす（つなげるときに二重にならないように） */
function stripPeriod(value: string): string {
  return value.trim().replace(/[。．.]+$/, "");
}

/**
 * 事実・気持ち・望みを、ひとつの文にまとめる。
 * 名詞で終わっても動詞で終わっても崩れないよう、文を切ってからつなぐ。
 */
export function composeIMessage(fact: string, feeling: string, hope: string): string {
  const parts: string[] = [];
  const f = stripPeriod(fact);
  const g = stripPeriod(feeling);
  const h = stripPeriod(hope);

  if (f) parts.push(`${f}。`);
  if (g) parts.push(f ? `そのとき私は${g}と感じました。` : `私は${g}と感じました。`);
  if (h) parts.push(`できれば${h}と嬉しいです。`);
  return parts.join("");
}

/* --- ④ 行動提案 ----------------------------------------------------- */

export interface ActionProposal {
  id: string;
  title: string;
  because: string;
  memberId?: string | null;
}

/**
 * 「小さく・自分だけで完結し・相手の変化を前提としない」ものだけを出す。
 * 相手に何かをさせる形の提案は作らない。
 */
export function buildActionProposals(snapshot: FamilySnapshot): ActionProposal[] {
  const proposals: ActionProposal[] = [];
  const { members } = snapshot;
  const already = new Set(
    pendingActions(snapshot).map((a) => a.title.trim()),
  );

  for (const issue of openIssues(snapshot).slice(0, 3)) {
    if (!issue.nextAction?.trim()) continue;
    if (already.has(issue.nextAction.trim())) continue;
    proposals.push({
      id: `issue-${issue.id}`,
      title: issue.nextAction.trim(),
      because: `「${issue.title}」に、あなた自身が書いた小さな一歩です。`,
      memberId: issue.memberIds[0] ?? null,
    });
  }

  // 同じ形の提案が並ぶと機械的に見えるので、種類ごとに1つまでにする
  const thanksTarget = members.find((m) => !m.isSelf && m.profile.gratitude.trim());
  if (thanksTarget) {
    const title = `${thanksTarget.name}に「ありがとう」とだけ伝えてみる`;
    if (!already.has(title)) {
      proposals.push({
        id: `thanks-${thanksTarget.id}`,
        title,
        because: "プロフィールに、感謝していることが書かれています。",
        memberId: thanksTarget.id,
      });
    }
  }

  const talkTarget = members.find((m) => !m.isSelf && m.profile.wantToTalk.trim());
  if (talkTarget) {
    const title = `${talkTarget.name}と話す時間を、10分だけ自分の中で決めておく`;
    if (!already.has(title)) {
      proposals.push({
        id: `talk-${talkTarget.id}`,
        title,
        because: "「話したいこと」が書かれています。相手の返事は前提にしません。",
        memberId: talkTarget.id,
      });
    }
  }

  const heavy = recentEmotions(snapshot.emotions, 14).filter(
    (l) => EMOTION_TONE[l.emotion] === "heavy" && l.intensity >= 4,
  );
  if (heavy.length >= 2) {
    const title = "今日は何も決めず、自分の気持ちだけ書いて終わりにする";
    if (!already.has(title)) {
      proposals.push({
        id: "rest",
        title,
        because: `直近2週間に、強く重い記録が ${heavy.length} 件あります。動かないことも選べます。`,
      });
    }
  }

  const quiet = members.filter((m) => {
    if (m.isSelf) return false;
    return !snapshot.emotions.some((l) => l.memberId === m.id && isWithinDays(l.loggedAt, 30));
  });
  for (const member of quiet.slice(0, 1)) {
    const title = `${member.name}のことを思い出して、気持ちをひとつだけ記録する`;
    if (!already.has(title)) {
      proposals.push({
        id: `record-${member.id}`,
        title,
        because: "この1か月、その人に関する気持ちの記録がありません。相手に何かを求める行動ではありません。",
        memberId: member.id,
      });
    }
  }

  return proposals.slice(0, 5);
}

/** 気持ちの言葉を、その人の記録から拾って提示するための補助 */
export function recentEmotionLabel(snapshot: FamilySnapshot, member: FamilyMember): string | null {
  const log = sortByDateDesc(
    snapshot.emotions.filter((l) => l.memberId === member.id),
    (l) => l.loggedAt,
  )[0];
  return log ? emotionMap[log.emotion].label : null;
}
