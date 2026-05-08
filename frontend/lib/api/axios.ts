import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getEnv } from "@/lib/utils/env";
import { useAuthStore } from "@/store/auth.store";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getEnv("API_URL", "http://localhost:8080"),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url && !config.url.startsWith("http") && !config.url.startsWith("//")) {
    const path = config.url.replace(/^\//, "");
    config.url = path;
  }
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function refreshCookieUrl(): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}/api/token/refresh`;
}

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    const shouldTryRefresh =
      status === 401 && originalRequest && !originalRequest._retry;

    if (shouldTryRefresh) {
      if (typeof window === "undefined") return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && typeof token === "string") {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ access: string }>(
          refreshCookieUrl(),
          {},
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        const newAccessToken = refreshResponse.data.access;
        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

export function getAxiosErrorMessage(error: unknown, fallback: string) {
  const err = error as AxiosError<Record<string, unknown>> | undefined;
  const data = err?.response?.data;
  const pick = (k: string) =>
    data && typeof data === "object" && k in data ? data[k] : undefined;
  const detail = pick("detail");
  if (typeof detail === "string") return detail;
  if (typeof pick("title") === "string" && typeof detail !== "string") {
    const title = pick("title");
    if (typeof title === "string") return title;
  }
  return (
    (typeof pick("error") === "string" ? (pick("error") as string) : undefined) ||
    (typeof pick("message") === "string" ? (pick("message") as string) : undefined) ||
    (error instanceof Error ? error.message : undefined) ||
    fallback
  );
}
