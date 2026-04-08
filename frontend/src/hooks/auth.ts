import { useEffect } from "preact/hooks";
import {
  setAuthToken,
  getAuthToken,
  isAuthenticated,
  getRefreshToken,
  setRefreshToken,
} from "@/utils/auth";
import { AUTH_API_ENDPOINT } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

interface TokenResponse {
  token: string;
  refresh_token: string;
}

export function useLogin() {
  return () => {
    window.location.href = `${window.location.origin}/api/auth/login`;
  };
}

async function useRefreshToken(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");
  const response = await fetch(`${AUTH_API_ENDPOINT}/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) await handleHttpError(response);
  return response.json();
}

export function useAutoRefreshToken() {
  useEffect(() => {
    async function tryRefresh() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return;
        const payload = JSON.parse(
          atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")),
        );
        const expiresIn = payload.exp - Date.now() / 1000;
        if (expiresIn < 5 * 60 && isAuthenticated()) {
          const data = await useRefreshToken();
          setAuthToken(data.token);
          setRefreshToken(data.refresh_token);
        }
      } catch {}
    }

    tryRefresh();
    const interval = setInterval(tryRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
