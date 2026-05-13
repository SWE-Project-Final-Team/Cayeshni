"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiJson,
  ApiError,
  isDefaultProfilePicture,
  readBodyAsJsonOrText,
  setAccessTokenRefreshHandler,
  setSessionInvalidationHandler,
} from "@/lib/api/client";
import { API_BASE } from "@/lib/api/config";
import { clearPostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { currencyValueFromApi } from "@/lib/currency";
import { parseEmailConfirmed } from "@/lib/jwt";

const ACCESS_KEY = "cayeshni_access_token";
const ACCOUNT_EMAIL_KEY = "cayeshni_account_email";

type AuthResponse = {
  accessToken: string;
  emailConfirmed: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string;
  preferredCurrency: number;
  createdAt: string;
};

type AuthContextValue = {
  accessToken: string | null;
  emailConfirmed: boolean;
  /** Email from profile or last login/register (for resend when profile is not loaded yet). */
  accountEmail: string | null;
  profile: UserProfile | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    name: string;
    password: string;
    preferredCurrency: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  loadProfile: () => Promise<void>;
  apiErrorMessage: (e: unknown) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function postAuth(path: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
  });
  const body = await readBodyAsJsonOrText(res);
  if (!res.ok) {
    throw new ApiError("Auth failed", res.status, body);
  }
  return body as AuthResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const persistAccountEmail = useCallback((email: string | null) => {
    if (email) {
      const t = email.trim();
      sessionStorage.setItem(ACCOUNT_EMAIL_KEY, t);
      setAccountEmail(t);
    } else {
      sessionStorage.removeItem(ACCOUNT_EMAIL_KEY);
      setAccountEmail(null);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(ACCOUNT_EMAIL_KEY);
    if (stored) setAccountEmail(stored);
  }, []);

  const applyToken = useCallback((token: string, confirmed?: boolean) => {
    sessionStorage.setItem(ACCESS_KEY, token);
    setAccessToken(token);
    setEmailConfirmed(
      confirmed !== undefined ? confirmed : parseEmailConfirmed(token)
    );
  }, []);

  const clearToken = useCallback(() => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ACCOUNT_EMAIL_KEY);
    clearPostAuthRedirect();
    setAccessToken(null);
    setEmailConfirmed(false);
    setProfile(null);
    setAccountEmail(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const data = await postAuth("/api/auth/refresh");
      applyToken(data.accessToken, data.emailConfirmed);
      return data.accessToken;
    } catch {
      return null;
    }
  }, [applyToken]);

  useEffect(() => {
    setAccessTokenRefreshHandler(refreshSession);
    return () => setAccessTokenRefreshHandler(null);
  }, [refreshSession]);

  useEffect(() => {
    setSessionInvalidationHandler(() => {
      clearToken();
    });
    return () => setSessionInvalidationHandler(null);
  }, [clearToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await refreshSession();
        if (!cancelled && !ok) {
          const stored = sessionStorage.getItem(ACCESS_KEY);
          if (stored) {
            setAccessToken(stored);
            setEmailConfirmed(parseEmailConfirmed(stored));
          }
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const loadProfile = useCallback(async () => {
    if (!accessToken) return;
    try {
      const raw = await apiJson<UserProfile & { preferredCurrency?: string | number }>(
        "/api/users/me",
        {
          accessToken,
        }
      );
      const pic = (raw.profilePictureUrl ?? "").trim();
      const me: UserProfile = {
        ...raw,
        preferredCurrency: currencyValueFromApi(raw.preferredCurrency),
        profilePictureUrl: isDefaultProfilePicture(pic) ? "" : pic,
      };
      setProfile(me);
      if (me.email) persistAccountEmail(me.email);
    } catch {
      setProfile(null);
    }
  }, [accessToken, persistAccountEmail]);

  useEffect(() => {
    if (accessToken) {
      void loadProfile();
    } else {
      setProfile(null);
    }
  }, [accessToken, loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiJson<AuthResponse>("/api/auth/login", {
        method: "POST",
        json: { email, password },
      });
      applyToken(data.accessToken, data.emailConfirmed);
      persistAccountEmail(email);
    },
    [applyToken, persistAccountEmail]
  );

  const register = useCallback(
    async (input: {
      email: string;
      name: string;
      password: string;
      preferredCurrency: number;
    }) => {
      const data = await apiJson<AuthResponse>("/api/auth/register", {
        method: "POST",
        json: input,
      });
      applyToken(data.accessToken, data.emailConfirmed);
      persistAccountEmail(input.email);
    },
    [applyToken, persistAccountEmail]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await apiJson("/api/auth/logout", {
          method: "POST",
          accessToken,
        });
      } catch {
        /* ignore */
      }
    }
    clearToken();
  }, [accessToken, clearToken]);

  const apiErrorMessage = useCallback((e: unknown) => {
    if (e instanceof ApiError) {
      const b = e.body as { error?: string; message?: string } | string;
      if (typeof b === "string") return b;
      if (b && typeof b === "object") {
        if (typeof b.error === "string") return b.error;
        if (typeof b.message === "string") return b.message;
      }
      return `Error (${e.status})`;
    }
    if (e instanceof Error) return e.message;
    return "Something went wrong.";
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      emailConfirmed,
      accountEmail,
      profile,
      bootstrapping,
      login,
      register,
      logout,
      refreshSession,
      loadProfile,
      apiErrorMessage,
    }),
    [
      accessToken,
      emailConfirmed,
      accountEmail,
      profile,
      bootstrapping,
      login,
      register,
      logout,
      refreshSession,
      loadProfile,
      apiErrorMessage,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
