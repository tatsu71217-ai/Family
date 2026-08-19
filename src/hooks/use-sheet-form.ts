"use client";

import * as React from "react";

/**
 * シート型フォームの開閉。
 * 開くたびに formKey が変わるので、フォーム側は key で作り直され、
 * 前回の入力が残らない（効果で state を戻す必要がない）。
 */
export function useSheetForm<T>() {
  const [state, setState] = React.useState<{ open: boolean; target: T | null; seq: number }>({
    open: false,
    target: null,
    seq: 0,
  });

  const openForm = React.useCallback((target: T | null = null) => {
    setState((current) => ({ open: true, target, seq: current.seq + 1 }));
  }, []);

  const setOpen = React.useCallback((open: boolean) => {
    setState((current) => ({ ...current, open }));
  }, []);

  return {
    open: state.open,
    target: state.target,
    formKey: state.seq,
    openForm,
    setOpen,
  };
}
