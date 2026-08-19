# 家族関係の地図

家族内の関係・感情・出来事・課題を整理するための Web アプリ（PWA）です。

**「家族を責めるのではなく、家族を理解するための地図」** をコンセプトに、
文章だけでは掴みにくい家族関係を、カード・関係図・タイムライン・グラフとして可視化します。

誰が悪いかを決めるためのものではありません。
関係の構造を眺め、状況を整理し、今日できる小さな行動につなげることを目的にしています。

---

## 画面

| 画面 | パス | 内容 |
| --- | --- | --- |
| ホーム / ダッシュボード | `/` | 家族の状態・メンバー・関係の内訳・最近の変化・出来事・課題・今週の小さな行動 |
| 家族構成 | `/family` | 家族の追加・編集・削除 |
| 家族メンバープロフィール | `/family/[id]` | 印象・想像・大切にしていそうなこと・感謝・話したいこと（すべて主観として記録） |
| 関係マップ | `/map` | 人をノード、関係を線で表す関係図（スマホでも操作可能） |
| 出来事タイムライン | `/timeline` | 年ごとにまとまる縦型タイムライン |
| 課題整理 | `/issues` | 状況 → 感情 → ニーズ → 行動 の順に整理 |
| 感情整理 | `/emotions` | 10種類の感情の記録、割合の円グラフ・時間変化の折れ線グラフ |
| 改善アクション | `/actions` | 小さな行動と、その後の気持ち・振り返り |
| 振り返り | `/review` | 入力内容の自動整理、期間の変化、書き留めた振り返り |
| 設定 | `/settings` | 保存先の確認、書き出し／読み込み、デモデータの切り替え |

## 技術構成

- Next.js 16（App Router）/ React 19 / TypeScript
- Tailwind CSS v4（`src/app/globals.css` にデザイントークン）
- shadcn/ui 方式の自前 UI コンポーネント（Radix UI ベース、`src/components/ui`）
- Recharts（感情の円グラフ・折れ線グラフ）
- 関係マップは依存を増やさず SVG で実装（パン・ピンチ拡大・ノードのドラッグに対応）
- Supabase（認証 + Postgres + RLS）※任意
- PWA（manifest / アイコン / standalone / Service Worker / オフライン画面）

## はじめかた

```bash
npm install
npm run dev
```

http://localhost:3000 を開くと、デモデータが入った状態で起動します。
設定画面から「空の状態から始める」を選ぶと、自分の記録を始められます。

## データの保存先

保存先は 2 通りあり、環境変数の有無で自動的に切り替わります。

### 1. 端末内保存（既定）

環境変数を設定しない場合、記録はブラウザの `localStorage` にだけ保存されます。
どこにも送信されません。設定画面から JSON で書き出し／読み込みができます。

### 2. Supabase

`.env.local` に次の 2 つを設定すると、Supabase 保存に切り替わり、
起動時にログイン画面が表示されます。

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（公開用の anon key）
```

スキーマとポリシーは `supabase/migrations/0001_init.sql` にあります。

```bash
supabase db push
```

（または Supabase Studio の SQL Editor に貼り付けて実行）

## セキュリティについて

- 全テーブルで Row Level Security を有効化し、`owner_id = auth.uid()` の行だけを本人が読み書きできます。
  子テーブルは「その家族が本人のものであること」も併せて検証します。
- クライアントが持つのは公開用の anon key だけです。
  **Service Role Key はブラウザに置かず、本アプリでは使用しません。**
- 入力値は保存前に長さを丸め、空文字は `null` に正規化します。
  データベース側にも文字数・列挙値・範囲の制約を置いています。
- 表示は React の既定のエスケープのみで行い、`dangerouslySetInnerHTML` は使いません。
- データベースアクセスは Supabase クライアント（パラメータ化クエリ）経由で、SQL 文字列の組み立てはしません。

## AI（整理）機能について

振り返り画面の「この1か月の整理」は、入力済みの内容を並べ直して見せるだけの機能です。
外部サービスへの送信は行いません（`src/lib/insights.ts` の `organizeSummary`）。

診断・医療判断・精神疾患の判定・家族の善悪判定・相手の心理の断定は行いません。

## UX 上のルール

1. 家族を「敵」として扱わない
2. 相手の心理を断定しない
3. 「正しい家族関係」を押し付けない
4. 改善を強制しない
5. 整理するのは、ユーザー自身の感情・認識・希望
6. 入力内容を可視化し、自分でも気づいていなかった構造に気づけるようにする

課題の「頻度 × 影響」は並べ替えのためだけに使い、人を採点するスコアは持ちません。

## ディレクトリ

```
src/
  app/                 各画面（App Router）
  components/
    ui/                ボタン・シート・入力などの基本部品
    layout/            シェル・ナビゲーション・認証
    family/            家族カード・家族フォーム
    map/               関係マップ（SVG）・関係フォーム
    charts/            Recharts のグラフ
  lib/
    types.ts           ドメイン型
    constants.ts       ラベル・配色
    insights.ts        集計と「整理」
    demo-data.ts       デモデータ
    store/             保存先の抽象（ローカル / Supabase）
    supabase/          Supabase クライアント
  hooks/
supabase/migrations/   スキーマと RLS
public/                manifest・アイコン・Service Worker
```

## コマンド

```bash
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm run start   # 本番サーバー
npm run lint    # ESLint
```

## 免責

このアプリは医療・心理の診断を行うものではありません。
気持ちがつらいときや、安全に関わる不安があるときは、
信頼できる人や専門の窓口への相談も検討してください。
