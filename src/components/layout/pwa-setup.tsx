"use client";

import { useEffect } from "react";

/**
 * PWA まわりの初期化。
 * - サービスワーカーの登録（オフラインでも基本UIが開けるように）
 * - 保存領域の永続化を要求（iOS/Safari は一定期間使わないとデータを消すことがあるため）
 * どちらも失敗してよい処理で、アプリ本体の動作には影響させない。
 */
export function PwaSetup() {
  useEffect(() => {
    if ("storage" in navigator && "persist" in navigator.storage) {
      navigator.storage.persisted?.().then((already) => {
        if (!already) navigator.storage.persist?.().catch(() => {});
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 登録できない環境でも通常どおり使える */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
