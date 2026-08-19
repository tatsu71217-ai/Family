import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/store/provider";
import { AppShell } from "@/components/layout/app-shell";
import { SaveIndicator } from "@/components/layout/save-indicator";
import { PwaSetup } from "@/components/layout/pwa-setup";

export const metadata: Metadata = {
  title: "家族関係の地図",
  description:
    "家族を責めるのではなく、家族を理解するための地図。関係・出来事・感情・課題を整理して、小さな行動につなげます。",
  applicationName: "家族関係の地図",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家族の地図",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f4",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <DataProvider>
          <AppShell>{children}</AppShell>
          <SaveIndicator />
        </DataProvider>
        <PwaSetup />
      </body>
    </html>
  );
}
