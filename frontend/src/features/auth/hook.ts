import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "@utils/query";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  exchangeToken as exchangeTokenAPI,
  refreshToken as refreshTokenAPI,
} from "@features/auth/api";
import { getMyUser } from "@features/user/api";
import {
  setJWTToken,
  getAccessToken,
  checkJWTToken,
  getRefreshToken,
  removeJWTToken,
} from "@features/auth/token";
import { AUTH_API_ENDPOINT } from "@utils/env";
import { AppError, FrontendErrorCode } from "@utils/error";



function isRedirectPath(path: string | null): path is string {
  return (
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
  );
}

export function useLogin() {
  const redirectPath = useLocation({ select: (loc: { pathname: string }) => loc.pathname });

  return (): void => {
    const redirectUrl = new URL(`${AUTH_API_ENDPOINT}/login`);
    redirectUrl.searchParams.set("redirect", redirectPath);
    window.location.href = redirectUrl.toString();
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, AppError, void>({
    mutationFn: async (): Promise<void> => {},
    onMutate: async () => {
      await queryClient.cancelQueries();
      removeJWTToken();
      queryClient.clear();
    },
    onSettled: () => {
      navigate({ to: '/', replace: true });
    },
  });
}

export function useLoginCallback() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
          navigate({ to: '/', replace: true });
          return;
        }

        const data = await exchangeTokenAPI({
          exchange_token: exchangeToken,
        });

        setJWTToken(data.access_token, data.refresh_token);
        const me = await getMyUser();
        queryClient.setQueryData(queryKeys.me(), me);
        const redirectPath = params.get("redirect");
        navigate({ to: isRedirectPath(redirectPath) ? redirectPath : '/', replace: true });
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
  const navigate = useNavigate();
  useEffect(() => {
    if (!checkJWTToken(getRefreshToken()))
      navigate({ to: '/', replace: true });
  }, []);
}
