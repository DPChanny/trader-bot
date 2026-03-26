import { useMutation } from "@tanstack/preact-query";
import { ADMIN_API_ENDPOINT } from "@/env";
import { setAuthToken, getAuthToken } from "@/utils/auth";
import { throwHttpError } from "@/utils/fetch";

interface TokenResponse {
  token: string;
}

async function adminLogin(password: string): Promise<TokenResponse> {
  const response = await fetch(`${ADMIN_API_ENDPOINT}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) await throwHttpError(response);

  return response.json();
}

async function refreshToken(): Promise<TokenResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token available");
  }

  const response = await fetch(`${ADMIN_API_ENDPOINT}/token/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) await throwHttpError(response);

  return response.json();
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: (password: string) => adminLogin(password),
    onSuccess: (data: TokenResponse) => {
      setAuthToken(data.token);
    },
  });
}

export function useTokenRefresh() {
  return useMutation({
    mutationFn: () => refreshToken(),
    onSuccess: (data: TokenResponse) => {
      setAuthToken(data.token);
    },
  });
}
