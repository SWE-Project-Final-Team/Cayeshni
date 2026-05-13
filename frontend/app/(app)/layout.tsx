"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MoneyLoadingScreen } from "@/components/money-loading-screen";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/auth-context";
import { sanitizePostAuthPath } from "@/lib/auth/post-auth-redirect";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, emailConfirmed, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) return;
    if (typeof window === "undefined") return;
    const path = window.location.pathname + window.location.search;
    const safe = sanitizePostAuthPath(path) ?? "/dashboard";

    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent(safe)}`);
      return;
    }

    if (!emailConfirmed) {
      router.replace(
        `/login?pendingVerification=1&next=${encodeURIComponent(safe)}`
      );
    }
  }, [bootstrapping, accessToken, emailConfirmed, router]);

  if (bootstrapping) {
    return (
      <MoneyLoadingScreen message="Securing your session and balances…" />
    );
  }

  if (!accessToken || !emailConfirmed) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
