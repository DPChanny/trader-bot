export interface DiscordUserDTO {
  discordId: string;
  name: string;
  avatarHash: string | null;
  avatarUrl: string | null;
}

// Backwards-compatible alias
export type DiscordDTO = DiscordUserDTO;
