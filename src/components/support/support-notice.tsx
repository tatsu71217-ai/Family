"use client";

import { Phone, ExternalLink } from "lucide-react";
import { SUPPORT_DIRECTORY_URL, SUPPORT_RESOURCES } from "@/lib/safety";

/**
 * 安全に関わる記述を見つけたときに、気づき・問いかけ・行動提案の代わりに出す案内。
 * ここでは分析結果を一切出さない。
 */
export function SupportNotice() {
  return (
    <section className="rounded-[var(--radius-card)] border border-sage/40 bg-sage-soft/40 p-5">
      <h2 className="text-[17px] font-semibold leading-snug text-ink">
        整理よりも先に、頼れる場所があります
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        書かれていた内容の中に、ひとりで抱えるには重いかもしれない言葉がありました。
        いまは気づきや提案を出さずに、相談できる窓口だけをお伝えします。
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        これは診断ではありません。あてはまらないと感じたら、そのままで大丈夫です。
        記録はこれまでどおり続けられます。
      </p>

      <ul className="mt-4 space-y-2">
        {SUPPORT_RESOURCES.map((resource) => (
          <li key={resource.name}>
            <a
              href={resource.href}
              className="flex items-start gap-3 rounded-[var(--radius-soft)] bg-surface px-4 py-3 transition-colors hover:bg-paper-deep"
            >
              <span
                aria-hidden
                className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sage-soft text-sage-deep"
              >
                <Phone className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{resource.name}</span>
                <span className="block text-[15px] font-semibold tracking-wide text-sage-deep">
                  {resource.contact}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-soft">
                  {resource.detail}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <a
        href={SUPPORT_DIRECTORY_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-medium text-ink"
      >
        <ExternalLink className="size-4" aria-hidden />
        厚生労働省「まもろうよ こころ」で最新の窓口を見る
      </a>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
        番号や受付時間は変わることがあります。危険が差し迫っているときは 110 番、
        けがや体調の急変には 119 番を使ってください。
      </p>
    </section>
  );
}
