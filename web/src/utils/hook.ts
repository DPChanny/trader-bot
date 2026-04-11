import { route } from "preact-router";
import { removeAuthToken, removeRefreshToken } from "@/utils/auth";
import { queryClient } from "@/utils/query";

export async function handleHttpError(response: Response): Promise<never> {
  if (response.status === 401) {
    removeAuthToken();
    removeRefreshToken();
    queryClient.setQueryData(["me"], null);
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
