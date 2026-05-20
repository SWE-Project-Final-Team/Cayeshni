"use client";

import { MoneyLoadingScreen } from "@/components/money-loading-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelect } from "@/components/language-select";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-md md:p-xl relative">
      <div className="absolute top-md right-md md:top-xl md:right-xl z-20">
        <ThemeToggle compact />
      </div>
      <div className="absolute top-md left-md md:top-xl md:left-xl z-20">
        <LanguageSelect className="w-[12rem]" />
      </div>
      {/* Wide column so standalone auth cards and Suspense fallbacks are not squeezed */}
      <div className="w-full max-w-[min(100vw-1.5rem,72rem)] mx-auto min-w-0">
        <Suspense
          fallback={
            <MoneyLoadingScreen
              variant="compact"
              message={t("Almost there…")}
            />
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
