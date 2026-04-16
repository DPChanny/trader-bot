import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { useEffect } from "preact/hooks";
import { queryKeys } from "@utils/query";
import { route } from "preact-router";
import {
  exchangeToken as exchangeAuthToken,
  refreshToken as refreshAuthToken,
} from "@apis/auth";
import { getMyUser } from "@apis/user";
import {
  setJWTToken,
  getAccessToken,
  checkJWTToken,
  getRefreshToken,
  removeJWTToken,
} from "@utils/auth";
import { AUTH_API_ENDPOINT } from "@utils/env";
import { AppError } from "@utils/error";

export function useLogin() {
  return (): void => {
    window.location.href = `${AUTH_API_ENDPOINT}/login`;
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, void>({
    mutationFn: async (): Promise<void> => {},
    onSettled: () => {
      removeJWTToken();
      queryClient.setQueryData(queryKeys.me(), null);
      route("/", true);
    },
  });
}

export function useLoginCallback() {
  const logout = useLogout();
  const queryClient = useQueryClient();
  useEffect(() => {
    async function handleLoginCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const exchangeToken = params.get("exchangeToken");

        if (!exchangeToken) {
          route("/", true);
          return;
        }

        const data = await exchangeAuthToken({
          exchange_token: exchangeToken,
        });

        setJWTToken(data.access_token, data.refresh_token);
        const me = await getMyUser();
        queryClient.setQueryData(queryKeys.me(), me);
        route("/", true);
      } catch {
        logout.mutate();
      }
    }

    void handleLoginCallback();
  }, []);
}

export function useRefreshToken() {
  const logout = useLogout();
  const queryClient = useQueryClient();
  useEffect(() => {
    async function tryRefresh() {
      if (!checkJWTToken(getRefreshToken())) return;
      const token = getAccessToken();
      if (token && checkJWTToken(token, 5 * 60)) {
        return;
      }
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logout.mutate();
          return;
        }

        const data = await refreshAuthToken({ refresh_token: refreshToken });
        setJWTToken(data.access_token, data.refresh_token);
        const me = await getMyUser();
        queryClient.setQueryData(queryKeys.me(), me);
      } catch {
        logout.mutate();
      }
    }

    tryRefresh();
    const interval = setInterval(tryRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
