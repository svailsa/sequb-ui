import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sequb UI",
  description: "Web frontend for Sequb Protocol - AI workflow orchestration",
  keywords: ["workflow", "automation", "AI", "sequb", "protocol"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased")}>
        <ErrorBoundary>
          <I18nProvider>
            <QueryProvider>
              <WebSocketProvider>
                {children}
              </WebSocketProvider>
            </QueryProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}