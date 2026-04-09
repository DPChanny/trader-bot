import type { DiscordUserDTO } from "./discordDto";
import type { GuildDTO } from "./guildDto";

export interface MemberDTO {
  memberId: number;
  guildId: string;
  discordUserId: string;
  role: number;
  riotId: string | null;
  name: string | null;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  discordUser: DiscordUserDTO;
  guild: GuildDTO;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  alias?: string | null;
  role?: number;
}
