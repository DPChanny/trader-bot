import type { DiscordUserDTO } from "./discordUserDto";

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
}

export interface UpdateMemberDTO {
  alias?: string | null;
  infoUrl?: string | null;
  role?: number;
}
