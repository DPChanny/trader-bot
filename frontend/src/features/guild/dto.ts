import type { BaseEntityDTO } from "@utils/dto";

export interface GuildDTO extends BaseEntityDTO {
  discordId: string;
  name: string;
  iconHash: string | null;
  inviteChannelId: string | null;
}

export interface GuildDetailDTO extends GuildDTO {
  iconUrl: string | null;
}
