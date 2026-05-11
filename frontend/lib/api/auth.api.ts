import axios from "axios";
import axiosInstance, { getAxiosErrorMessage } from "@/lib/api/axios";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/user";
import type { AxiosError } from "axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  access: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ConfirmEmailPayload {
  userId: string;
  token: string;
}

function bffOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await axios.post<AuthResponse>(
      `${bffOrigin()}/api/register`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const ax = error as AxiosError | undefined;
    throw new Error(
      getAxiosErrorMessage(
        error,
        "Registration failed: " + (ax?.response?.status ?? "")
      )
    );
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { data } = await axios.post<AuthResponse>(
      `${bffOrigin()}/api/token`,
      credentials,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return data;
  } catch (error) {
    const ax = error as AxiosError | undefined;
    throw new Error(
      getAxiosErrorMessage(error, "Login failed: " + (ax?.response?.status ?? ""))
    );
  }
}

export async function logout(): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  try {
    await axios.post(
      `${bffOrigin()}/api/logout`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      }
    );
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Logout failed"));
  }
}

export async function refreshToken(): Promise<{ access: string }> {
  try {
    const { data } = await axios.post<{ access: string }>(
      `${bffOrigin()}/api/token/refresh`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    if (typeof window !== "undefined") {
      useAuthStore.getState().setAccessToken(data.access);
    }
    return data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Token refresh failed"));
  }
}

export async function tryRestoreSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (useAuthStore.getState().accessToken) return true;
  try {
    await refreshToken();
    return true;
  } catch {
    return false;
  }
}

function mapProfile(d: {
  id?: string;
  email?: string;
  name?: string;
  Id?: string;
  Email?: string;
  Name?: string;
}): User {
  const id = (d.id ?? d.Id) as string;
  const email = (d.email ?? d.Email) as string;
  const name = (d.name ?? d.Name) as string;
  return {
    id,
    email,
    name,
    permissions: [],
  };
}

export async function me(): Promise<User> {
  try {
    const { data } = await axiosInstance.get<User | Record<string, unknown>>(
      "/users/me"
    );
    return mapProfile(data as Record<string, unknown>);
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to fetch user"));
  }
}

export async function forgotPassword(email: string): Promise<string> {
  try {
    const { data } = await axiosInstance.post<{ message?: string }>(
      "/auth/forgot-password",
      { email: email.trim() }
    );
    return data?.message || "If that email exists, a reset link has been sent.";
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to request password reset"));
  }
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  try {
    await axiosInstance.post("/auth/reset-password", payload);
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to reset password"));
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  try {
    await axiosInstance.post("/auth/change-password", payload);
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to change password"));
  }
}

export async function confirmEmail(payload: ConfirmEmailPayload): Promise<void> {
  try {
    await axiosInstance.post("/auth/confirm-email", payload);
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to confirm email"));
  }
}

export async function resendConfirmation(email: string): Promise<string> {
  try {
    const { data } = await axiosInstance.post<{ message?: string }>(
      "/auth/resend-confirmation",
      { email: email.trim() }
    );
    return data?.message || "If that email is registered and unconfirmed, a new link has been sent.";
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to resend confirmation"));
  }
}
