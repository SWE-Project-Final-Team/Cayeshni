import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset password - Cayeshni",
  description: "Set a new password for your Cayeshni account.",
};

export default function ResetPasswordRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background p-md text-on-background md:p-xl">
          <p className="text-body-md text-on-surface-variant">Loading...</p>
        </main>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
