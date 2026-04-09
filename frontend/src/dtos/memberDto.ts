import type { DiscordDTO } from "./discordDto";
import type { GuildDTO } from "./guildDto";

export interface MemberDTO {
  memberId: number;
  guildId: number;
  discordId: string;
  role: number;
  riotId: string | null;
  name: string | null;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  discord: DiscordDTO;
  guild: GuildDTO;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  alias?: string | null;
  role?: number;
}
