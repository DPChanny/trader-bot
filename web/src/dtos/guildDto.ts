export interface GuildDTO {
  discordId: string;
  name: string;
  iconHash: string | null;
}

export interface GuildDetailDTO extends GuildDTO {
  iconUrl: string | null;
}
