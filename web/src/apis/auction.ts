import type { AddAuctionDTO, AuctionDTO } from "@/dtos/auctionDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getAuctionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function postAuction({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: AddAuctionDTO;
}): Promise<AuctionDTO> {
  const response = await fetch(getAuctionEndpoint(guildId, presetId), {
    method: "POST",
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<AuctionDTO>(json);
}
