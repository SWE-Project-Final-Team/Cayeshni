import { create } from "zustand";
import type { User } from "@/types/user";
import { deleteCookie } from "@/lib/utils/cookie-utils";

interface AuthState {
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  hasHydrated: boolean;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  isLoading: false,
  hasHydrated: false,
  accessToken: null,
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () => {
    deleteCookie("session");
    set({
      user: null,
      permissions: [],
      isLoading: false,
      hasHydrated: false,
      accessToken: null,
    });
  },
}));

export const useUser = () => useAuthStore((s) => s.user);
export const usePermissions = () => useAuthStore((s) => s.permissions);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
