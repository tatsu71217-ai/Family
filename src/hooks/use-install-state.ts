"use client";

import * as React from "react";

export interface InstallState {
  /** iPhone / iPad から見ているか */
  isIos: boolean;
  /** ホーム画面から起動しているか（インストール済み） */
  isStandalone: boolean;
  /** ブラウザ側の判定が終わったか（サーバー描画との食い違いを避けるため） */
  ready: boolean;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeToDisplayMode(onChange: () => void) {
  const media = window.matchMedia(STANDALONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readStandalone(): boolean {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS はデスクトップ表示を名乗ることがあるので、タッチ点数と合わせて判定する
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1)
  );
}

/** 変化を購読しない値のための空の購読 */
const noSubscribe = () => () => {};

/**
 * 端末とインストール状況の判定。
 * ブラウザ固有の値なので、サーバー描画時は「分からない」を返して食い違いを避ける。
 */
export function useInstallState(): InstallState {
  const isStandalone = React.useSyncExternalStore(subscribeToDisplayMode, readStandalone, () => false);
  const isIos = React.useSyncExternalStore(noSubscribe, readIos, () => false);
  const ready = React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  return { isIos, isStandalone, ready };
}
