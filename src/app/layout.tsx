import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { UIConfigurationProvider } from "@/components/providers/ui-configuration-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { CSPProvider } from "@/components/providers/csp-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils/cn";
import { generateCSPNonce } from "@/lib/utils/csp-nonce";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sequb UI",
  description: "Web frontend for Sequb Protocol - AI workflow orchestration",
  keywords: ["workflow", "automation", "AI", "sequb", "protocol"],
  robots: "noindex, nofollow", // Prevent search engine indexing for security
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate nonce for this request
  const nonce = generateCSPNonce();
  
  // Try to get nonce from middleware headers
  let middlewareNonce: string | null = null;
  try {
    const headersList = await headers();
    middlewareNonce = headersList.get('X-CSP-Nonce');
  } catch {
    // Headers not available in this context, use generated nonce
  }
  
  const finalNonce = middlewareNonce || nonce;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="csp-nonce" content={finalNonce} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Security-related meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="0" />
        
        {/* Preconnect to known domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch control */}
        <meta httpEquiv="x-dns-prefetch-control" content="off" />
      </head>
      <body className={cn(inter.className, "antialiased")}>
        <ErrorBoundary>
          <CSPProvider>
            <I18nProvider>
              <QueryProvider>
                <UIConfigurationProvider>
                  <WebSocketProvider>
                    <PreferencesProvider>
                      {children}
                    </PreferencesProvider>
                  </WebSocketProvider>
                </UIConfigurationProvider>
              </QueryProvider>
            </I18nProvider>
          </CSPProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}