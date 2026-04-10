import type { DiscordUserDTO } from "./discordUserDto";
import type { GuildDTO } from "./guildDto";

export interface MemberDTO {
  memberId: number;
  guildId: string;
  discordUserId: string;
  role: number;
  name: string | null;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
  infoUrl: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  discordUser: DiscordUserDTO;
  guild: GuildDTO;
}

export interface UpdateMemberDTO {
  alias?: string | null;
  infoUrl?: string | null;
  role?: number;
}
