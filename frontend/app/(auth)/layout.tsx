import { MoneyLoadingScreen } from "@/components/money-loading-screen";
import type { ReactNode } from "react";
import { Suspense } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-md md:p-xl">
      {/* Wide column so standalone auth cards and Suspense fallbacks are not squeezed */}
      <div className="w-full max-w-[min(100vw-1.5rem,72rem)] mx-auto min-w-0">
        <Suspense
          fallback={
            <MoneyLoadingScreen
              variant="compact"
              message="Almost there…"
            />
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
