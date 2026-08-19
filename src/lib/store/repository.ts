import type { Family, FamilySnapshot, SnapshotCollection } from "@/lib/types";

export type StorageMode = "local" | "supabase";

export type CollectionItem<K extends SnapshotCollection> = FamilySnapshot[K][number];

/**
 * データ保存の抽象。ローカル保存と Supabase の両方が同じ形で振る舞う。
 * 画面側は保存先を意識しない。
 */
export interface Repository {
  readonly mode: StorageMode;
  /** 保存済みデータを読む。まだ何も無ければ null。 */
  load(): Promise<FamilySnapshot | null>;
  /** 初期データ（デモ／空）をまとめて書き込む。 */
  seed(snapshot: FamilySnapshot): Promise<void>;
  updateFamily(family: Family): Promise<void>;
  upsert<K extends SnapshotCollection>(collection: K, item: CollectionItem<K>): Promise<void>;
  remove(collection: SnapshotCollection, id: string): Promise<void>;
  /** 家族データをすべて消す。 */
  clear(): Promise<void>;
}
