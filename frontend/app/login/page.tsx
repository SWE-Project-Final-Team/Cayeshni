import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — Cayeshni",
  description: "Sign in or create an account for Cayeshni.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background p-md text-on-background md:p-xl">
          <p className="text-body-md text-on-surface-variant">Loading…</p>
        </main>
      }
    >
      <AuthPage />
    </Suspense>
  );
}
