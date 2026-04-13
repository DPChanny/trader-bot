import { getAccessToken } from "@/utils/auth";

export function getAuthHeader(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getJsonHeader(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export function getHeaders(...headers: HeadersInit[]): HeadersInit {
  return Object.assign({}, ...headers);
}
