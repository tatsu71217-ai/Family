"use client";

import * as React from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type {
  Family,
  FamilySnapshot,
  SnapshotCollection,
} from "@/lib/types";
import { buildDemoSnapshot, buildEmptySnapshot } from "@/lib/demo-data";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LocalRepository } from "./local-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { CollectionItem, Repository, StorageMode } from "./repository";
import { nowIso } from "@/lib/utils";

type Status = "loading" | "ready" | "signed-out" | "error";

interface DataContextValue {
  status: Status;
  mode: StorageMode;
  /** デモデータで動いているか（設定画面などで明示する） */
  isDemo: boolean;
  error: string | null;
  data: FamilySnapshot | null;
  email: string | null;
  saving: boolean;
  save: <K extends SnapshotCollection>(collection: K, item: CollectionItem<K>) => Promise<void>;
  remove: (collection: SnapshotCollection, id: string) => Promise<void>;
  renameFamily: (name: string) => Promise<void>;
  resetToDemo: () => Promise<void>;
  startEmpty: () => Promise<void>;
  /** 書き出したJSONを読み込んで、いまのデータを置き換える。 */
  importSnapshot: (snapshot: FamilySnapshot) => Promise<void>;
  signOut: () => Promise<void>;
  supabase: SupabaseClient | null;
}

const DataContext = React.createContext<DataContextValue | null>(null);

const DEMO_FLAG_KEY = "kazoku-map:is-demo:v1";

function readDemoFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
}

function writeDemoFlag(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(DEMO_FLAG_KEY, "1");
  else window.localStorage.removeItem(DEMO_FLAG_KEY);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = React.useState<Session | null>(null);
  const [authChecked, setAuthChecked] = React.useState(!isSupabaseConfigured);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<FamilySnapshot | null>(null);
  const [isDemo, setIsDemo] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  /* --- 認証（Supabase を設定している場合のみ） --- */
  React.useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data: result }) => {
      if (!active) return;
      setSession(result.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthChecked(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const repository: Repository | null = React.useMemo(() => {
    if (!isSupabaseConfigured) return new LocalRepository();
    if (supabase && session?.user) return new SupabaseRepository(supabase, session.user.id);
    return null;
  }, [supabase, session]);

  /* --- 初回読み込み。データが無ければデモデータを入れる --- */
  React.useEffect(() => {
    if (!authChecked || !repository) return;
    let active = true;
    (async () => {
      try {
        let snapshot = await repository.load();
        let demo = readDemoFlag();
        if (!snapshot) {
          snapshot = buildDemoSnapshot();
          await repository.seed(snapshot);
          demo = true;
          writeDemoFlag(true);
        }
        if (!active) return;
        setData(snapshot);
        setIsDemo(demo);
        setLoadError(null);
      } catch (e) {
        if (!active) return;
        setLoadError(e instanceof Error ? e.message : "データを読み込めませんでした。");
      }
    })();
    return () => {
      active = false;
    };
  }, [repository, authChecked]);

  /* 状態は保持せず、いま分かっていることから導く */
  const status: Status = !authChecked
    ? "loading"
    : !repository
      ? "signed-out"
      : data
        ? "ready"
        : loadError
          ? "error"
          : "loading";

  const withSave = React.useCallback(
    async (fn: () => Promise<void>) => {
      setSaving(true);
      try {
        await fn();
        setSaveError(null);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "保存できませんでした。");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const save = React.useCallback(
    async <K extends SnapshotCollection>(collection: K, item: CollectionItem<K>) => {
      if (!repository) return;
      // 画面はすぐ更新し、保存は裏で行う（体感を軽くするため）
      setData((current) => {
        if (!current) return current;
        const list = current[collection] as CollectionItem<K>[];
        const exists = list.some((entry) => entry.id === item.id);
        const next = exists
          ? list.map((entry) => (entry.id === item.id ? item : entry))
          : [...list, item];
        return { ...current, [collection]: next } as FamilySnapshot;
      });
      await withSave(() => repository.upsert(collection, item));
    },
    [repository, withSave],
  );

  const remove = React.useCallback(
    async (collection: SnapshotCollection, id: string) => {
      if (!repository) return;
      setData((current) => {
        if (!current) return current;
        const list = current[collection] as { id: string }[];
        const next = list.filter((entry) => entry.id !== id);
        const cleaned = { ...current, [collection]: next } as FamilySnapshot;
        // 人を消したら、その人に紐づく関係も残さない
        if (collection === "members") {
          cleaned.relationships = cleaned.relationships.filter(
            (r) => r.memberAId !== id && r.memberBId !== id,
          );
        }
        return cleaned;
      });

      await withSave(async () => {
        if (collection === "members") {
          const orphans = (data?.relationships ?? []).filter(
            (r) => r.memberAId === id || r.memberBId === id,
          );
          for (const orphan of orphans) {
            await repository.remove("relationships", orphan.id);
          }
        }
        await repository.remove(collection, id);
      });
    },
    [repository, withSave, data],
  );

  const renameFamily = React.useCallback(
    async (name: string) => {
      if (!repository || !data) return;
      const next: Family = { ...data.family, name, updatedAt: nowIso() };
      setData((current) => (current ? { ...current, family: next } : current));
      await withSave(() => repository.updateFamily(next));
    },
    [repository, data, withSave],
  );

  const replaceAll = React.useCallback(
    async (snapshot: FamilySnapshot, demo: boolean) => {
      if (!repository) return;
      await withSave(async () => {
        await repository.clear();
        await repository.seed(snapshot);
        setData(snapshot);
        setIsDemo(demo);
        writeDemoFlag(demo);
      });
    },
    [repository, withSave],
  );

  const resetToDemo = React.useCallback(
    () => replaceAll(buildDemoSnapshot(), true),
    [replaceAll],
  );

  const startEmpty = React.useCallback(
    () => replaceAll(buildEmptySnapshot(), false),
    [replaceAll],
  );

  const importSnapshot = React.useCallback(
    (snapshot: FamilySnapshot) => replaceAll(snapshot, false),
    [replaceAll],
  );

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setData(null);
  }, [supabase]);

  const value: DataContextValue = {
    status,
    mode: isSupabaseConfigured ? "supabase" : "local",
    isDemo,
    error: saveError ?? loadError,
    data,
    email: session?.user?.email ?? null,
    saving,
    save,
    remove,
    renameFamily,
    resetToDemo,
    startEmpty,
    importSnapshot,
    signOut,
    supabase,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData は DataProvider の内側でのみ使えます。");
  return ctx;
}

/** データが揃っている前提で使う簡易フック。読み込み中は null を返す。 */
export function useSnapshot(): FamilySnapshot | null {
  return useData().data;
}
