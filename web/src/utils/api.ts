import { route } from "preact-router";
import {
  removeAccessToken,
  removeRefreshToken,
  getAccessToken,
} from "@/utils/auth";
import { queryClient, queryKeys } from "@/utils/query";

export async function handleHttpError(response: Response): Promise<never> {
  if (response.status === 401) {
    removeAccessToken();
    removeRefreshToken();
    queryClient.setQueryData(queryKeys.me(), null);
    route("/");
  }
  let message: string;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } else {
      message = `HTTP ${response.status}`;
    }
  } catch {
    message = `HTTP ${response.status}`;
  }
  throw new Error(message);
}

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
