import Link from "next/link";

export const metadata = { title: "オフライン — 家族関係の地図" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div aria-hidden className="mb-4 text-4xl">
        🌙
      </div>
      <h1 className="text-lg font-semibold text-ink">いまはオフラインです</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        接続が戻ると、いつもどおり開けます。
        <br />
        これまでに保存した内容は消えていません。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-sage px-6 text-[15px] font-medium text-white"
      >
        ホームへ戻る
      </Link>
    </div>
  );
}
