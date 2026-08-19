"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useData } from "@/lib/store/provider";
import { BottomNav } from "./bottom-nav";
import { AuthGate } from "./auth-gate";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, error } = useData();
  const offline = useOffline();
  const pathname = usePathname();

  // オフライン画面はデータやログイン状態に関係なく開けるようにする
  if (pathname === "/offline") return <>{children}</>;

  if (status === "signed-out") return <AuthGate />;

  return (
    <>
      {offline ? (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-sand-soft px-4 py-2 text-[13px] text-[#96794f] md:top-auto md:bottom-16"
        >
          <WifiOff className="size-4" aria-hidden />
          オフラインです。表示中の内容は見られます。
        </div>
      ) : null}

      <main className={offline ? "pt-9 md:pt-0" : undefined}>
        {status === "loading" ? (
          <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-8 md:pt-24">
            <PageSkeleton />
          </div>
        ) : status === "error" ? (
          <div className="mx-auto w-full max-w-md px-5 py-24 text-center">
            <div aria-hidden className="mb-3 text-3xl">
              🫖
            </div>
            <h1 className="text-lg font-semibold text-ink">データを読み込めませんでした</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{error}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              もう一度試す
            </Button>
          </div>
        ) : (
          children
        )}
      </main>

      {status === "ready" ? <BottomNav /> : null}
    </>
  );
}

function useOffline() {
  const [offline, setOffline] = React.useState(false);
  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline;
}
