"use client";

import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import LanguageSelector from "@/components/language-selector";
import { useI18n } from "@/providers/i18n-provider";
import { useUIConfigurationStore } from "@/stores/ui-configuration-store";
import Link from "next/link";

export function Header() {
  const { t } = useI18n();
  const { isFeatureEnabled } = useUIConfigurationStore();
  
  // Feature flags
  const showStatusIndicators = isFeatureEnabled('statusIndicators');
  const showLanguageSelector = isFeatureEnabled('multiLanguage');

  return (
    <header className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Sequb</h1>
          <div className="text-sm text-muted-foreground">
            AI Workflow Orchestration
          </div>
          {showStatusIndicators && (
            <div className="flex items-center space-x-3">
              <StatusIndicator type="backend" />
              <StatusIndicator type="websocket" />
              <OfflineIndicator />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showLanguageSelector && <LanguageSelector />}
          <Link href={"/settings" as any}>
            <Button variant="ghost" size="icon" title={t('nav.settings')}>
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" title={t('auth.profile')}>
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title={t('auth.logout')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}