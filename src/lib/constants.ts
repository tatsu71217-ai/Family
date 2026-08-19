import type {
  ActionStatus,
  EmotionKey,
  FamilyMood,
  RelationStatus,
  Scale,
} from "./types";

/* ------------------------------------------------------------------
   ラベルと配色。
   断定的・評価的な語（「悪い」「問題人物」など）は使わない。
   色は警告色を避け、やわらかいトーンで統一する。
   ------------------------------------------------------------------ */

export interface Option<T extends string> {
  value: T;
  label: string;
  emoji: string;
  /** カード等の背景／文字色（Tailwind クラス） */
  chip: string;
  /** 図やグラフで使う実カラー */
  color: string;
  hint?: string;
}

export const FAMILY_MOODS: Option<FamilyMood>[] = [
  {
    value: "good",
    label: "良好",
    emoji: "😊",
    chip: "bg-sage-soft text-sage-deep",
    color: "#7fa88e",
    hint: "今は穏やかに感じている",
  },
  {
    value: "slight",
    label: "少し気になる",
    emoji: "😐",
    chip: "bg-sand-soft text-[#96794f]",
    color: "#cbae8b",
    hint: "小さな引っかかりがある",
  },
  {
    value: "careful",
    label: "注意",
    emoji: "😟",
    chip: "bg-rose-soft text-[#a86f6f]",
    color: "#d3a0a0",
    hint: "気をつけて見ていたい",
  },
  {
    value: "thinking",
    label: "考え中",
    emoji: "💭",
    chip: "bg-lilac-soft text-[#7d6ea6]",
    color: "#a99ac9",
    hint: "まだ言葉にできていない",
  },
];

export const RELATION_STATUSES: Option<RelationStatus>[] = [
  {
    value: "good",
    label: "良好",
    emoji: "🌿",
    chip: "bg-sage-soft text-sage-deep",
    color: "#7fa88e",
  },
  {
    value: "normal",
    label: "普通",
    emoji: "🫧",
    chip: "bg-sky-soft text-[#5a7ba6]",
    color: "#8fa9c9",
  },
  {
    value: "distant",
    label: "少し距離がある",
    emoji: "🍂",
    chip: "bg-sand-soft text-[#96794f]",
    color: "#cbae8b",
  },
  {
    value: "tense",
    label: "緊張",
    emoji: "🌡️",
    chip: "bg-rose-soft text-[#a86f6f]",
    color: "#d3a0a0",
  },
  {
    value: "complex",
    label: "複雑",
    emoji: "🌀",
    chip: "bg-lilac-soft text-[#7d6ea6]",
    color: "#a99ac9",
  },
  {
    value: "unknown",
    label: "不明",
    emoji: "❓",
    chip: "bg-stone-soft text-[#7c766e]",
    color: "#b3aca4",
  },
];

export const EMOTIONS: Option<EmotionKey>[] = [
  { value: "joy", label: "嬉しい", emoji: "😊", chip: "bg-sage-soft text-sage-deep", color: "#7fb59b" },
  { value: "sadness", label: "悲しい", emoji: "😢", chip: "bg-sky-soft text-[#5a7ba6]", color: "#8fa9c9" },
  { value: "anger", label: "怒り", emoji: "😠", chip: "bg-rose-soft text-[#a86f6f]", color: "#d3a0a0" },
  { value: "anxiety", label: "不安", emoji: "😰", chip: "bg-lilac-soft text-[#7d6ea6]", color: "#a99ac9" },
  { value: "lonely", label: "寂しい", emoji: "🌙", chip: "bg-sky-soft text-[#5a7ba6]", color: "#7f93b8" },
  { value: "relief", label: "安心", emoji: "☺️", chip: "bg-sage-soft text-sage-deep", color: "#9cc3a8" },
  { value: "gratitude", label: "感謝", emoji: "🙏", chip: "bg-sand-soft text-[#96794f]", color: "#e0b979" },
  { value: "tired", label: "疲れ", emoji: "😮‍💨", chip: "bg-stone-soft text-[#7c766e]", color: "#b3aca4" },
  { value: "hope", label: "期待", emoji: "✨", chip: "bg-sand-soft text-[#96794f]", color: "#cbae8b" },
  { value: "confused", label: "戸惑い", emoji: "😶‍🌫️", chip: "bg-stone-soft text-[#7c766e]", color: "#c3b6cf" },
];

export const ACTION_STATUSES: Option<ActionStatus>[] = [
  { value: "todo", label: "未実行", emoji: "🌱", chip: "bg-stone-soft text-[#7c766e]", color: "#b3aca4" },
  { value: "today", label: "今日やる", emoji: "🌤️", chip: "bg-sand-soft text-[#96794f]", color: "#cbae8b" },
  { value: "done", label: "実行済み", emoji: "🌸", chip: "bg-sage-soft text-sage-deep", color: "#7fa88e" },
  { value: "hold", label: "保留", emoji: "🫙", chip: "bg-sky-soft text-[#5a7ba6]", color: "#8fa9c9" },
];

/** 続柄の候補（自由入力も可） */
export const RELATION_PRESETS = [
  "自分",
  "父",
  "母",
  "祖父",
  "祖母",
  "兄",
  "姉",
  "弟",
  "妹",
  "夫",
  "妻",
  "息子",
  "娘",
  "甥",
  "姪",
  "叔父",
  "叔母",
  "いとこ",
  "その他",
];

/** アイコン候補。人物写真は扱わず、やわらかい絵文字で表す。 */
export const AVATAR_PRESETS = [
  "🙂", "🧑", "👩", "👨", "👵", "👴", "👧", "👦", "🧒",
  "🐣", "🐧", "🐨", "🐰", "🦊", "🌱", "🌼", "⭐", "🫖", "🧺",
];

export const FREQUENCY_LABELS: Record<Scale, string> = {
  1: "ごくたまに",
  2: "たまに",
  3: "ときどき",
  4: "よくある",
  5: "ほぼいつも",
};

export const IMPACT_LABELS: Record<Scale, string> = {
  1: "ほとんど影響しない",
  2: "少し影響する",
  3: "そこそこ影響する",
  4: "かなり影響する",
  5: "とても大きく影響する",
};

export const IMPORTANCE_LABELS: Record<Scale, string> = {
  1: "小さな出来事",
  2: "覚えている出来事",
  3: "印象に残る出来事",
  4: "大きな出来事",
  5: "とても大きな出来事",
};

export const INTENSITY_LABELS: Record<Scale, string> = {
  1: "かすかに",
  2: "少し",
  3: "そこそこ",
  4: "強く",
  5: "とても強く",
};

/** 小さな改善アクションの例（押し付けではなく「候補」として提示する） */
export const ACTION_SUGGESTIONS = [
  "今日は一度だけ話を遮らず聞く",
  "感謝を一つ伝える",
  "10分だけ一緒に過ごす",
  "すぐ反論せず一晩置く",
  "自分の気持ちを整理してから話す",
  "「ありがとう」とだけ送ってみる",
  "相手の好きな話題を一つ思い出す",
  "今日は何も言わずに横にいる",
];

export const SCALE_VALUES: Scale[] = [1, 2, 3, 4, 5];

/* --- ルックアップ ------------------------------------------------- */

function toMap<T extends string>(options: Option<T>[]): Record<T, Option<T>> {
  return Object.fromEntries(options.map((o) => [o.value, o])) as Record<T, Option<T>>;
}

export const moodMap = toMap(FAMILY_MOODS);
export const relationStatusMap = toMap(RELATION_STATUSES);
export const emotionMap = toMap(EMOTIONS);
export const actionStatusMap = toMap(ACTION_STATUSES);

/** 感情のおおまかな方向。振り返りで「変化」を見せるために使う（善悪の判定ではない）。 */
export const EMOTION_TONE: Record<EmotionKey, "warm" | "heavy" | "neutral"> = {
  joy: "warm",
  relief: "warm",
  gratitude: "warm",
  hope: "warm",
  sadness: "heavy",
  anger: "heavy",
  anxiety: "heavy",
  lonely: "heavy",
  tired: "heavy",
  confused: "neutral",
};
