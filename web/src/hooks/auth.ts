import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { useEffect } from "preact/hooks";
import { queryKeys } from "@/utils/query";
import { route } from "preact-router";
import type { JwtTokenDTO } from "@/dtos/authDto";
import {
  exchangeToken as exchangeAuthToken,
  refreshToken as refreshAuthToken,
} from "@/apis/auth";
import {
  setAccessToken,
  getAccessToken,
  checkRefreshToken,
  getRefreshToken,
  setRefreshToken,
  removeAccessToken,
  removeRefreshToken,
} from "@/utils/auth";
import { AUTH_API_ENDPOINT } from "@/utils/env";

export function useLogin(redirect?: string) {
  return (): void => {
    const base = `${AUTH_API_ENDPOINT}/login`;
    const url = redirect
      ? `${base}?redirect=${encodeURIComponent(redirect)}`
      : base;
    window.location.href = url;
  };
}

export function useLogout(redirect?: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async (): Promise<void> => {},
    onSettled: () => {
      removeAccessToken();
      removeRefreshToken();
      queryClient.setQueryData(queryKeys.me(), null);
      route(redirect ?? "/", true);
    },
  });
}

export function useLoginCallback() {
  const queryClient = useQueryClient();
  useEffect(() => {
    async function handleLoginCallback() {
      const params = new URLSearchParams(window.location.search);
      const exchangeToken = params.get("exchangeToken");
      const callbackRedirect = params.get("redirect") ?? "/";

      if (!exchangeToken) {
        route("/", true);
        return;
      }

      const data = await exchangeAuthToken({
        exchange_token: exchangeToken,
      });

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      route(callbackRedirect, true);
    }

    void handleLoginCallback();
  }, []);
}

async function useRefreshToken(): Promise<JwtTokenDTO> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");
  return refreshAuthToken({ refresh_token: refreshToken });
}

export function useAutoRefreshToken() {
  const queryClient = useQueryClient();
  useEffect(() => {
    async function tryRefresh() {
      if (!checkRefreshToken()) return;
      const token = getAccessToken();
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
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      } catch {}
    }

    tryRefresh();
    const interval = setInterval(tryRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
