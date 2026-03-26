import { useMutation } from "@tanstack/preact-query";
import { AUTH_API_ENDPOINT } from "@/env";
import { setAuthToken, getAuthToken } from "@/utils/auth";
import { throwHttpError } from "@/utils/fetch";

interface TokenResponse {
  token: string;
}

export function useDiscordLogin() {
  return () => {
    window.location.href = `${AUTH_API_ENDPOINT}/login`;
  };
}

async function refreshToken(): Promise<TokenResponse> {
  const token = getAuthToken();
  if (!token) throw new Error("No token available");
  const response = await fetch(`${AUTH_API_ENDPOINT}/token/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) await throwHttpError(response);
  return response.json();
}

export function useTokenRefresh() {
  return useMutation({
    mutationFn: () => refreshToken(),
    onSuccess: (data: TokenResponse) => {
      setAuthToken(data.token);
    },
  });
}
