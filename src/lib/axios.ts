import axios from "axios";
import { shouldEmitUnauthorized } from "@/lib/authSession";
import { getDeviceId } from "@/lib/deviceId";

// Production on Cloudflare Pages calls the API subdomain directly.
// Local dev falls back to the backend on localhost:3000.
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.PROD ? "https://api.copheles.online" : "http://localhost:3000");

function usesDirectNgrok(baseUrl: string): boolean {
  if (!baseUrl.includes("ngrok")) return false;
  if (typeof window === "undefined") return false;
  try {
    return new URL(baseUrl).origin !== window.location.origin;
  } catch {
    return false;
  }
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    ...(usesDirectNgrok(API_BASE_URL)
      ? { "ngrok-skip-browser-warning": "true" }
      : {}),
  },
});

axiosClient.interceptors.request.use((config) => {
  config.headers.set("X-Device-Id", getDeviceId());
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url as string | undefined;
    if (error.response?.status === 401 && shouldEmitUnauthorized(url)) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);
