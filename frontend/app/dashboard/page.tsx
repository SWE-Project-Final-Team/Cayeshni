"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-on-background">
        <p className="text-body-md text-on-surface-variant">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-lg text-on-background md:p-xl">
      <div className="mx-auto max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-level-1">
        <h1 className="text-headline-md text-primary mb-md">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant mb-sm">
          Signed in as{" "}
          <span className="font-medium text-on-surface">{user.email}</span>
        </p>
        {user.name ? (
          <p className="text-body-md text-on-surface-variant mb-xl">
            Name: <span className="text-on-surface">{user.name}</span>
          </p>
        ) : (
          <div className="mb-xl" />
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="text-label-sm rounded-lg border border-outline-variant bg-surface-container-low px-lg py-md text-primary transition-colors hover:bg-surface-container-lowest"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
