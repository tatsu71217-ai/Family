"use client";

import * as React from "react";

/** 同じキーを見ている画面へ変更を伝えるための購読者 */
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

/**
 * localStorage に保存する真偽値。
 * 「案内を閉じた」のような、データ本体ではない小さな状態に使う。
 */
export function useLocalFlag(key: string): [boolean, (value: boolean) => void] {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(onChange);
      listeners.set(key, set);
      window.addEventListener("storage", onChange);
      return () => {
        set.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    [key],
  );

  const value = React.useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) === "1",
    // サーバー描画時は「立っている」とみなし、案内が一瞬ちらつかないようにする
    () => true,
  );

  const setValue = React.useCallback(
    (next: boolean) => {
      if (next) window.localStorage.setItem(key, "1");
      else window.localStorage.removeItem(key);
      notify(key);
    },
    [key],
  );

  return [value, setValue];
}
