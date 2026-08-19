import { createId, daysAgo, nowIso } from "./utils";
import { emptyProfile, type FamilySnapshot } from "./types";

/**
 * 初回起動時に表示するサンプルデータ。
 * 実在の人物についての診断・断定ではなく、機能を理解するためのデモ。
 * 設定画面からいつでも消すことができる。
 */
export const DEMO_FAMILY_NAME = "デモの家族";

export function buildDemoSnapshot(): FamilySnapshot {
  const familyId = createId();
  const ts = nowIso();

  const mk = (
    name: string,
    relation: string,
    avatar: string,
    mood: "good" | "slight" | "careful" | "thinking",
    isSelf = false,
    profile: Partial<ReturnType<typeof emptyProfile>> = {},
  ) => ({
    id: createId(),
    familyId,
    name,
    relation,
    avatar,
    mood,
    notes: null,
    profile: { ...emptyProfile(), ...profile },
    isSelf,
    createdAt: ts,
    updatedAt: ts,
  });

  const self = mk("自分", "自分", "🙂", "thinking", true, {
    impression: "最近は少し気を張っている気がする。",
    wantToTalk: "これからのことを、落ち着いているときに話したい。",
  });
  const father = mk("父", "父", "👨", "slight", false, {
    impression: "自分から見ると、あまり多くを話さない人に見える。",
    imagined: "想像すると、心配していることを言葉にしにくいのかもしれない。",
    values: "家族が困らないこと、を大事にしていそう。",
    struggles: "気持ちの話題は苦手そう。",
    gratitude: "黙って送り迎えをしてくれたこと。",
    concerns: "体調のこと。",
  });
  const mother = mk("母", "母", "👩", "good", false, {
    impression: "自分から見ると、よく話しかけてくれる。",
    imagined: "そうかもしれない、と思うのは、心配を会話で埋めているのかも。",
    values: "家族が集まる時間を大切にしていそう。",
    gratitude: "毎日の食事のこと。",
  });
  const sister = mk("姉", "姉", "🧑", "good", false, {
    impression: "話しやすい。近況をよく共有してくれる。",
    gratitude: "相談に乗ってくれること。",
  });
  const brother = mk("弟", "弟", "🧒", "slight", false, {
    impression: "最近は自分の時間を大事にしている様子。",
    concerns: "あまり話す機会がないこと。",
  });

  const members = [self, father, mother, sister, brother];

  const rel = (a: string, b: string, status: FamilySnapshot["relationships"][number]["status"], note: string) => ({
    id: createId(),
    familyId,
    memberAId: a,
    memberBId: b,
    status,
    note,
    createdAt: ts,
    updatedAt: ts,
  });

  const relationships = [
    rel(self.id, mother.id, "normal", "話す機会は多い。すれ違うこともある。"),
    rel(self.id, father.id, "distant", "会話の量が少ない時期が続いている。"),
    rel(self.id, sister.id, "good", "近況をよく話せている。"),
    rel(self.id, brother.id, "normal", "会えば話すが、頻度は少なめ。"),
    rel(father.id, mother.id, "complex", "外からは分かりにくい部分がある。"),
    rel(mother.id, sister.id, "good", "よく連絡を取り合っている様子。"),
  ];

  const events = [
    {
      id: createId(),
      familyId,
      title: "引っ越し",
      description: "家族で今の家に移った。生活のリズムが大きく変わった。",
      eventDate: "2020-04-10",
      importance: 4 as const,
      emotion: "confused" as const,
      impact: "それぞれの部屋ができて、集まる時間が減った気がする。",
      memberIds: [self.id, father.id, mother.id, sister.id, brother.id],
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      title: "姉が家を出た",
      description: "進学のタイミングで別々に暮らすことになった。",
      eventDate: "2023-03-20",
      importance: 3 as const,
      emotion: "lonely" as const,
      impact: "会う回数は減ったが、連絡は前より丁寧になった。",
      memberIds: [self.id, sister.id],
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      title: "食卓での言い合い",
      description: "進路の話から、お互いに強い言い方になってしまった。",
      eventDate: daysAgo(21).slice(0, 10),
      importance: 4 as const,
      emotion: "anger" as const,
      impact: "それ以来、その話題を避けている。",
      memberIds: [self.id, father.id],
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      title: "母と二人で買い物",
      description: "特別な話はしなかったけれど、穏やかな時間だった。",
      eventDate: daysAgo(5).slice(0, 10),
      importance: 2 as const,
      emotion: "relief" as const,
      impact: "何も決めなくても一緒にいられる時間がある、と気づいた。",
      memberIds: [self.id, mother.id],
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const issues = [
    {
      id: createId(),
      familyId,
      title: "進路の話題になると会話が止まる",
      description: "話し始めるとお互いに構えてしまい、途中で終わってしまう。",
      frequency: 3 as const,
      impact: 4 as const,
      trouble: "本当は相談したいのに、切り出せないまま時間が過ぎている。",
      desiredState: "結論を出さなくても、途中まで一緒に考えられる状態。",
      nextAction: "結論を求めずに、今考えていることだけを5分話してみる。",
      memberIds: [self.id, father.id],
      resolvedAt: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      title: "連絡の頻度が人によって偏っている",
      description: "姉とはよく話すが、弟とは月に一度あるかどうか。",
      frequency: 4 as const,
      impact: 2 as const,
      trouble: "気にはなっているが、きっかけが作れない。",
      desiredState: "用事がなくても短く連絡できる関係。",
      nextAction: "面白かったものを一つだけ送ってみる。",
      memberIds: [self.id, brother.id],
      resolvedAt: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const emo = (
    emotion: FamilySnapshot["emotions"][number]["emotion"],
    intensity: 1 | 2 | 3 | 4 | 5,
    days: number,
    memberId: string | null,
    context: string,
    desiredResponse: string | null = null,
  ) => ({
    id: createId(),
    familyId,
    memberId,
    emotion,
    intensity,
    context,
    desiredResponse,
    loggedAt: daysAgo(days),
    createdAt: daysAgo(days),
  });

  const emotions = [
    emo("anger", 4, 21, father.id, "食卓で言い合いになったとき。", "落ち着いて自分の考えを伝えたかった。"),
    emo("tired", 3, 19, null, "その日は何も考えたくなかった。"),
    emo("anxiety", 3, 15, father.id, "また同じ話題になったらどうしよう、と考えた。"),
    emo("lonely", 2, 12, brother.id, "家に誰もいない時間が長かった。"),
    emo("gratitude", 4, 9, mother.id, "何も聞かずに夕飯を用意してくれていた。"),
    emo("relief", 4, 5, mother.id, "一緒に買い物に行った帰り道。"),
    emo("hope", 3, 3, self.id, "少しずつなら話せるかもしれないと思えた。"),
    emo("joy", 4, 1, sister.id, "姉から近況の連絡があった。"),
  ];

  const actions = [
    {
      id: createId(),
      familyId,
      targetMemberId: father.id,
      title: "今日は一度だけ話を遮らず聞く",
      dueDate: daysAgo(-2).slice(0, 10),
      status: "today" as const,
      afterFeeling: null,
      reflection: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      targetMemberId: mother.id,
      title: "感謝を一つ伝える",
      dueDate: daysAgo(4).slice(0, 10),
      status: "done" as const,
      afterFeeling: "言ったあとは少しほっとした。",
      reflection: "短い言葉でも伝わることがあると分かった。",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: createId(),
      familyId,
      targetMemberId: brother.id,
      title: "面白かったものを一つだけ送ってみる",
      dueDate: null,
      status: "todo" as const,
      afterFeeling: null,
      reflection: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const reviews = [
    {
      id: createId(),
      familyId,
      periodStart: daysAgo(30).slice(0, 10),
      periodEnd: daysAgo(0).slice(0, 10),
      wentWell: "母に感謝を伝えられた。買い物の時間が穏やかだった。",
      stillOnMind: "父との進路の話は、まだ切り出せていない。",
      noticedChange: "強い感情のあとに、少しずつ落ち着いた記録が増えている。",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  return {
    family: {
      id: familyId,
      name: DEMO_FAMILY_NAME,
      createdAt: ts,
      updatedAt: ts,
    },
    members,
    relationships,
    events,
    issues,
    emotions,
    actions,
    reviews,
  };
}

export function buildEmptySnapshot(name = "わたしの家族"): FamilySnapshot {
  const ts = nowIso();
  return {
    family: { id: createId(), name, createdAt: ts, updatedAt: ts },
    members: [],
    relationships: [],
    events: [],
    issues: [],
    emotions: [],
    actions: [],
    reviews: [],
  };
}
