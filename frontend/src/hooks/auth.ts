import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { useEffect, useState } from "preact/hooks";
import { queryKeys } from "@utils/query";
import { route } from "preact-router";
import {
  exchangeToken as exchangeTokenAPI,
  refreshToken as refreshTokenAPI,
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
import { AppError, FrontendErrorCode } from "@utils/error";
import { useRoutePath } from "@hooks/router";

function isRedirectPath(path: string | null): path is string {
  return (
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
  );
}

export function useLogin() {
  const redirectPath = useRoutePath();

  return (): void => {
    const redirectUrl = new URL(`${AUTH_API_ENDPOINT}/login`);
    redirectUrl.searchParams.set("redirect", redirectPath);
    window.location.href = redirectUrl.toString();
  };
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, AppError, void>({
    mutationFn: async (): Promise<void> => {},
    onMutate: async () => {
      await queryClient.cancelQueries();
      removeJWTToken();
      queryClient.clear();
    },
    onSettled: () => {
      route("/", true);
    },
  });
}

export function useLoginCallback() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<AppError | null>(null);

  const retry = () => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");
    const redirectUrl = new URL(`${AUTH_API_ENDPOINT}/login`);
    redirectUrl.searchParams.set(
      "redirect",
      isRedirectPath(redirectPath) ? redirectPath : "/",
    );
    window.location.href = redirectUrl.toString();
  };

  useEffect(() => {
    async function handleLoginCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const exchangeToken = params.get("exchangeToken");

        if (!exchangeToken) {
          route("/", true);
          return;
        }

        const data = await exchangeTokenAPI({
          exchange_token: exchangeToken,
        });

        setJWTToken(data.access_token, data.refresh_token);
        const me = await getMyUser();
        queryClient.setQueryData(queryKeys.me(), me);
        const redirectPath = params.get("redirect");
        route(isRedirectPath(redirectPath) ? redirectPath : "/", true);
      } catch (e) {
        setError(
          e instanceof AppError
            ? e
            : new AppError(FrontendErrorCode.Unexpected.External),
        );
      }
    }

    void handleLoginCallback();
  }, []);

  return { error, retry };
}

export function useRefreshToken() {
  const logout = useLogout();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function tryRefresh() {
      const refreshToken = getRefreshToken();
      if (!refreshToken || !checkJWTToken(refreshToken)) {
        if (getAccessToken()) {
          logout.mutate();
        }
        return;
      }

      const accessToken = getAccessToken();
      if (accessToken && checkJWTToken(accessToken)) {
        return;
      }

      try {
        const data = await refreshTokenAPI({ refresh_token: refreshToken });
        setJWTToken(data.access_token, data.refresh_token);
        const me = await getMyUser();
        queryClient.setQueryData(queryKeys.me(), me);
      } catch {
        logout.mutate();
      }
    }

    void tryRefresh();
    const interval = setInterval(tryRefresh, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

export function useAuthGuard() {
  useEffect(() => {
    if (!checkJWTToken(getRefreshToken())) route("/", true);
  }, []);
}
