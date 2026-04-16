import type { CreateAuctionDTO, AuctionDTO } from "@dtos/auction";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { getAuctionEndpoint } from "@utils/env";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function createAuction({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: CreateAuctionDTO;
}): Promise<AuctionDTO> {
  const response = await fetch(getAuctionEndpoint(guildId, presetId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<AuctionDTO>(json);
}
