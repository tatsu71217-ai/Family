"use client";

import { emptyProfile, type Family, type FamilySnapshot, type SnapshotCollection } from "@/lib/types";
import type { CollectionItem, Repository, StorageMode } from "./repository";

const STORAGE_KEY = "kazoku-map:snapshot:v1";

/**
 * 端末内だけにデータを持つ保存先。
 * Supabase を設定していない状態でもアプリが完結して動くようにするためのもの。
 * データは他人へ送信されない。
 */
export class LocalRepository implements Repository {
  readonly mode: StorageMode = "local";

  private read(): FamilySnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as FamilySnapshot;
      if (!parsed?.family?.id) return null;
      return normalize(parsed);
    } catch {
      return null;
    }
  }

  private write(snapshot: FamilySnapshot) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  async load() {
    return this.read();
  }

  async seed(snapshot: FamilySnapshot) {
    this.write(snapshot);
  }

  async updateFamily(family: Family) {
    const current = this.read();
    if (!current) return;
    this.write({ ...current, family });
  }

  async upsert<K extends SnapshotCollection>(collection: K, item: CollectionItem<K>) {
    const current = this.read();
    if (!current) return;
    const list = current[collection] as CollectionItem<K>[];
    const index = list.findIndex((entry) => entry.id === item.id);
    const next = index >= 0 ? list.map((e, i) => (i === index ? item : e)) : [...list, item];
    this.write({ ...current, [collection]: next } as FamilySnapshot);
  }

  async remove(collection: SnapshotCollection, id: string) {
    const current = this.read();
    if (!current) return;
    const list = current[collection] as { id: string }[];
    this.write({ ...current, [collection]: list.filter((e) => e.id !== id) } as FamilySnapshot);
  }

  async clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/** 旧バージョンで保存された欠損フィールドを埋める。 */
function normalize(snapshot: FamilySnapshot): FamilySnapshot {
  return {
    ...snapshot,
    members: (snapshot.members ?? []).map((m) => ({
      ...m,
      profile: { ...emptyProfile(), ...(m.profile ?? {}) },
    })),
    relationships: snapshot.relationships ?? [],
    events: (snapshot.events ?? []).map((e) => ({ ...e, memberIds: e.memberIds ?? [] })),
    issues: (snapshot.issues ?? []).map((i) => ({ ...i, memberIds: i.memberIds ?? [] })),
    emotions: snapshot.emotions ?? [],
    actions: snapshot.actions ?? [],
    reviews: snapshot.reviews ?? [],
  };
}
