"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { me, logout as logoutApi, tryRestoreSession } from "@/lib/api/auth.api";
import type { User } from "@/types/user";

function isNetworkError(err: unknown): boolean {
  return (err instanceof Error ? err.message : String(err)) === "Network Error";
}

function isExpectedAuthError(err: unknown): boolean {
  const s = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    s.includes("no refresh token") ||
    s.includes("refresh token") ||
    s.includes("unauthorized") ||
    s.includes("authentication") ||
    s.includes("credentials were not provided") ||
    s.includes("failed to fetch user") ||
    s.includes("token refresh failed")
  );
}

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated);
  const logoutStore = useAuthStore((s) => s.logout);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      await tryRestoreSession();
      const userData: User = await me();
      setUser(userData);
      setPermissions(userData.permissions || []);
    } catch (err) {
      setUser(null);
      setPermissions([]);
      if (isExpectedAuthError(err)) {
        // Expected after logout / expired session — interceptor handles hard redirect on API 401.
      } else if (isNetworkError(err)) {
        logoutStore();
        router.push("/login");
      } else {
        console.error("Failed to load user:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, setPermissions, logoutStore, router]);

  useEffect(() => {
    if (!hasHydrated && !isLoading) {
      setHasHydrated(true);
      loadUser().catch(() => {});
    }
  }, [hasHydrated, isLoading, setHasHydrated, loadUser]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error(e);
    } finally {
      logoutStore();
      router.push("/login");
    }
  }, [logoutStore, router]);

  return { user, permissions, isLoading, loadUser, logout };
}
