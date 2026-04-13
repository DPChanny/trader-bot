import type {
  ExchangeTokenDTO,
  JwtTokenDTO,
  RefreshTokenDTO,
} from "@/dtos/authDto";
import { AUTH_API_ENDPOINT } from "@/utils/env";
import { handleHttpError } from "@/utils/error";

export async function exchangeToken(
  dto: ExchangeTokenDTO,
): Promise<JwtTokenDTO> {
  const response = await fetch(`${AUTH_API_ENDPOINT}/token/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    await handleHttpError(response);
  }

  return response.json();
}

export async function refreshToken(dto: RefreshTokenDTO): Promise<JwtTokenDTO> {
  const response = await fetch(`${AUTH_API_ENDPOINT}/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    await handleHttpError(response);
  }

  return response.json();
}
