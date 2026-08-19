"use client";

import { Share, X } from "lucide-react";
import { useInstallState } from "@/hooks/use-install-state";
import { useLocalFlag } from "@/hooks/use-local-flag";

const DISMISS_KEY = "kazoku-map:install-hint-dismissed:v1";

/**
 * iPhone / iPad 向けの「ホーム画面に追加」の案内。
 * iOS には自動のインストール案内が無いので、手順だけ静かに置いておく。
 * 一度閉じたら出さない。
 */
export function InstallHint() {
  const { isIos, isStandalone, ready } = useInstallState();
  const [dismissed, setDismissed] = useLocalFlag(DISMISS_KEY);

  if (!ready || !isIos || isStandalone || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-4">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-sage-deep"
      >
        <Share className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">ホーム画面に追加できます</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          Safari 下部の共有ボタン
          <Share className="mx-1 inline size-3.5 align-[-2px]" aria-hidden />
          から「ホーム画面に追加」を選ぶと、アプリのように開けます。
          記録も消えにくくなります。
        </p>
      </div>
      <button
        type="button"
        aria-label="この案内を閉じる"
        onClick={() => setDismissed(true)}
        className="-mr-2 -mt-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-deep hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
