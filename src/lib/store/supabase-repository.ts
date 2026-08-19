"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Family, FamilySnapshot, SnapshotCollection } from "@/lib/types";
import type { CollectionItem, Repository, StorageMode } from "./repository";
import { TABLES, fromRow, toRow } from "./mappers";

/**
 * Supabase を保存先とする実装。
 * すべての行は owner_id = ログイン中ユーザー で書き込み、読み取りは RLS 側でも制限する
 * （supabase/migrations のポリシー参照）。クライアントは anon key しか持たない。
 */
export class SupabaseRepository implements Repository {
  readonly mode: StorageMode = "supabase";

  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async load(): Promise<FamilySnapshot | null> {
    const { data: families, error } = await this.client
      .from(TABLES.family)
      .select("*")
      .eq("owner_id", this.userId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw new Error(error.message);
    if (!families?.length) return null;

    const family = fromRow.family(families[0]);
    const collections: SnapshotCollection[] = [
      "members",
      "relationships",
      "events",
      "issues",
      "emotions",
      "actions",
      "reviews",
    ];

    const results = await Promise.all(
      collections.map((collection) =>
        this.client.from(TABLES[collection]).select("*").eq("family_id", family.id),
      ),
    );

    const snapshot = { family } as FamilySnapshot;
    collections.forEach((collection, index) => {
      const result = results[index];
      if (result.error) throw new Error(result.error.message);
      const rows = (result.data ?? []) as Record<string, unknown>[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (snapshot as any)[collection] = rows.map((row) => (fromRow[collection] as any)(row));
    });

    return snapshot;
  }

  async seed(snapshot: FamilySnapshot) {
    await this.updateFamily(snapshot.family);
    const collections: SnapshotCollection[] = [
      "members",
      "relationships",
      "events",
      "issues",
      "emotions",
      "actions",
      "reviews",
    ];
    for (const collection of collections) {
      const rows = snapshot[collection] as unknown as Record<string, unknown>[];
      if (!rows.length) continue;
      const { error } = await this.client
        .from(TABLES[collection])
        .upsert(rows.map((row) => toRow(collection, row, this.userId)));
      if (error) throw new Error(error.message);
    }
  }

  async updateFamily(family: Family) {
    const { error } = await this.client
      .from(TABLES.family)
      .upsert(toRow("family", family as unknown as Record<string, unknown>, this.userId));
    if (error) throw new Error(error.message);
  }

  async upsert<K extends SnapshotCollection>(collection: K, item: CollectionItem<K>) {
    const { error } = await this.client
      .from(TABLES[collection])
      .upsert(toRow(collection, item as unknown as Record<string, unknown>, this.userId));
    if (error) throw new Error(error.message);
  }

  async remove(collection: SnapshotCollection, id: string) {
    const { error } = await this.client.from(TABLES[collection]).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async clear() {
    // families を消すと子テーブルは ON DELETE CASCADE で一緒に消える。
    const { error } = await this.client.from(TABLES.family).delete().eq("owner_id", this.userId);
    if (error) throw new Error(error.message);
  }
}
