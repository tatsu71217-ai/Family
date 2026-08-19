import type { FamilySnapshot } from "./types";

/* ------------------------------------------------------------------
   安全に関わる記述の検知と、頼れる場所の案内。

   ここでの判定は「診断」ではない。
   記録の中に、整理よりも先に助けが必要かもしれない言葉があるかどうかを
   端末の中だけで見るためのもの。外部へは何も送信しない。

   検知したときは、気づき・問いかけ・行動提案の生成をすべて止める。
   ------------------------------------------------------------------ */

export type SafetyTopic = "harm" | "self" | "control";

export interface SafetySignal {
  topic: SafetyTopic;
  /** どの記録で見つかったか（画面には出さず、件数の把握にだけ使う） */
  matched: string;
}

/**
 * 検知に使う語。
 * 迷ったら拾う側に倒す。案内を出しすぎても害は小さいが、
 * 見落とすと必要な情報が届かないため。
 */
const PATTERNS: { topic: SafetyTopic; words: string[] }[] = [
  {
    topic: "harm",
    words: [
      "殴ら", "殴る", "殴られ", "叩かれ", "叩く", "蹴られ", "蹴る",
      "暴力", "虐待", "突き飛ば", "首を絞", "髪を引っ張", "髪を掴",
      "物を投げつけ", "怪我をさせ", "あざができ", "痣ができ", "骨折",
      "包丁を", "刃物を",
    ],
  },
  {
    topic: "self",
    words: [
      "死にたい", "死のう", "消えたい", "いなくなりたい",
      "生きていたくない", "生きていても", "自殺", "自傷",
      "リストカット", "手首を切", "楽になりたい", "終わりにしたい",
      "居場所がない",
    ],
  },
  {
    topic: "control",
    words: [
      "逆らえない", "逆らうと", "従わないと", "怒鳴られ", "恫喝",
      "脅され", "脅かされ", "閉じ込め", "監視され", "束縛",
      "外に出してもらえ", "外出させてもらえ", "お金を渡してもらえ",
      "通帳を取り上げ", "携帯を取り上げ", "スマホを取り上げ",
      "家に帰れない", "帰りたくても",
    ],
  },
];

/** 記録の中から、本文として扱うテキストをすべて集める */
function collectText(snapshot: FamilySnapshot): string[] {
  const texts: string[] = [];
  const push = (value: string | null | undefined) => {
    if (value && value.trim()) texts.push(value);
  };

  for (const member of snapshot.members) {
    push(member.notes);
    Object.values(member.profile).forEach(push);
  }
  for (const relationship of snapshot.relationships) push(relationship.note);
  for (const event of snapshot.events) {
    push(event.title);
    push(event.description);
    push(event.impact);
  }
  for (const issue of snapshot.issues) {
    push(issue.title);
    push(issue.description);
    push(issue.trouble);
    push(issue.desiredState);
  }
  for (const log of snapshot.emotions) {
    push(log.context);
    push(log.desiredResponse);
  }
  for (const action of snapshot.actions) {
    push(action.afterFeeling);
    push(action.reflection);
  }
  for (const review of snapshot.reviews) {
    push(review.wentWell);
    push(review.stillOnMind);
    push(review.noticedChange);
  }
  return texts;
}

export function scanText(texts: string[]): SafetySignal[] {
  const signals: SafetySignal[] = [];
  for (const text of texts) {
    for (const { topic, words } of PATTERNS) {
      for (const word of words) {
        if (text.includes(word)) {
          signals.push({ topic, matched: word });
          break;
        }
      }
    }
  }
  return signals;
}

/** 記録全体を見て、サポート案内を優先すべき状態かどうかを返す */
export function detectSafetySignals(snapshot: FamilySnapshot): SafetySignal[] {
  return scanText(collectText(snapshot));
}

export function hasSafetySignal(snapshot: FamilySnapshot): boolean {
  return detectSafetySignals(snapshot).length > 0;
}

export interface SupportResource {
  name: string;
  contact: string;
  detail: string;
  href?: string;
}

/**
 * 頼れる場所（日本国内）。
 * 番号や受付時間は変わることがあるため、公式のまとめページも必ず併記する。
 */
export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    name: "いのちの電話（フリーダイヤル）",
    contact: "0120-783-556",
    detail: "毎日 16時〜21時／毎月10日は 8時〜翌8時。話を聴いてもらえます。",
    href: "tel:0120783556",
  },
  {
    name: "よりそいホットライン",
    contact: "0120-279-338",
    detail: "24時間・年中無休。どんな内容でも相談できます。",
    href: "tel:0120279338",
  },
  {
    name: "こころの健康相談統一ダイヤル",
    contact: "0570-064-556",
    detail: "お住まいの都道府県の相談窓口につながります。",
    href: "tel:0570064556",
  },
  {
    name: "DV相談＋（プラス）",
    contact: "0120-279-889",
    detail: "24時間。家庭内の暴力について、電話・メール・チャットで相談できます。",
    href: "tel:0120279889",
  },
  {
    name: "児童相談所虐待対応ダイヤル",
    contact: "189",
    detail: "24時間。子どもに関わる不安や、子ども自身からの相談も受けています。",
    href: "tel:189",
  },
  {
    name: "警察相談専用電話",
    contact: "#9110",
    detail: "緊急ではないけれど不安なとき。緊急時は 110 番へ。",
    href: "tel:9110",
  },
];

export const SUPPORT_DIRECTORY_URL = "https://www.mhlw.go.jp/mamorouyokokoro/";
