const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export function getJWTTokenExp(jwtToken: string | null): Date | null {
  if (!jwtToken) return null;
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof payload.exp !== "number") return null;
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

function setJWTCookie(name: string, jwtToken: string): void {
  const expires = getJWTTokenExp(jwtToken);
  if (!expires) return;
  document.cookie = `${name}=${jwtToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  for (const cookie of document.cookie.split(";")) {
    const [k, v] = cookie.trim().split("=");
    if (k === name) return v ?? null;
  }
  return null;
}

export function setAccessToken(token: string): void {
  setJWTCookie(ACCESS_TOKEN_COOKIE_NAME, token);
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE_NAME);
}

export function removeAccessToken(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function setRefreshToken(token: string): void {
  setJWTCookie(REFRESH_TOKEN_COOKIE_NAME, token);
}

export function setJWTToken(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE_NAME);
}

export function removeRefreshToken(): void {
  document.cookie = `${REFRESH_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function removeJWTToken(): void {
  removeAccessToken();
  removeRefreshToken();
}

export function checkJWTToken(jwtToken: string | null): boolean {
  const expires = getJWTTokenExp(jwtToken);
  return expires !== null && expires.getTime() > Date.now() + 5 * 60 * 1000;
}
