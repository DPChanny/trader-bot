import type { AuctionDTO } from "@features/auction/dto";
import { toCamelCase } from "@utils/dto";
import { getAuctionEndpoint } from "@utils/env";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function createAuction({
  guildId,
  presetId,
}: {
  guildId: string;
  presetId: number;
}): Promise<AuctionDTO> {
  const response = await fetch(getAuctionEndpoint(guildId, presetId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify({}),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<AuctionDTO>(json);
}
