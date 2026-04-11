import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import type {
  ExchangeTokenDTO,
  RefreshTokenDTO,
  TokenDTO,
} from "@/dtos/authDto";
import {
  setAuthToken,
  getAuthToken,
  isAuthenticated,
  getRefreshToken,
  setRefreshToken,
  removeAuthToken,
  removeRefreshToken,
} from "@/utils/auth";
import { AUTH_API_ENDPOINT } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";
import { queryClient } from "@/utils/query";

export function useLogin(redirect?: string) {
  return () => {
    const base = `${window.location.origin}/api/auth/login`;
    const url = redirect
      ? `${base}?redirect=${encodeURIComponent(redirect)}`
      : base;
    window.location.href = url;
  };
}

export function useLogout(redirect?: string) {
  return () => {
    removeAuthToken();
    removeRefreshToken();
    queryClient.setQueryData(["me"], null);
    route(redirect ?? "/");
  };
}

export function useLoginCallback() {
  useEffect(() => {
    async function handleLoginCallback() {
      const params = new URLSearchParams(window.location.search);
      const exchangeToken = params.get("exchangeToken");
      const callbackRedirect = params.get("redirect") ?? "/";

      if (!exchangeToken) {
        route("/", true);
        return;
      }

      const response = await fetch(`${AUTH_API_ENDPOINT}/token/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchange_token: exchangeToken,
        } satisfies ExchangeTokenDTO),
      });
      if (!response.ok) {
        await handleHttpError(response);
        return;
      }

      const data = (await response.json()) as TokenDTO;
      setAuthToken(data.token);
      setRefreshToken(data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      route(callbackRedirect, true);
    }

    void handleLoginCallback();
  }, []);
}

async function useRefreshToken(): Promise<TokenDTO> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");
  const response = await fetch(`${AUTH_API_ENDPOINT}/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    } satisfies RefreshTokenDTO),
  });
  if (!response.ok) await handleHttpError(response);
  return response.json();
}

export function useAutoRefreshToken() {
  useEffect(() => {
    async function tryRefresh() {
      if (!isAuthenticated()) return;
      const token = getAuthToken();
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length !== 3) return;
          const payload = JSON.parse(
            atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")),
          );
          const expiresIn = payload.exp - Date.now() / 1000;
          if (expiresIn >= 5 * 60) return;
        } catch {
          return;
        }
      }
      try {
        const data = await useRefreshToken();
        setAuthToken(data.token);
        setRefreshToken(data.refresh_token);
        queryClient.invalidateQueries({ queryKey: ["me"] });
      } catch {}
    }

    tryRefresh();
    const interval = setInterval(tryRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
