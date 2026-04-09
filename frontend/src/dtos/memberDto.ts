export interface DiscordDTO {
  discordId: string;
  name: string;
  avatarHash: string | null;
  avatarUrl: string | null;
}

export interface MemberDTO {
  memberId: number;
  guildId: number;
  riotId: string | null;
  discordId: string;
  role: number;
}

export interface MemberDetailDTO extends MemberDTO {
  discord: DiscordDTO;
}

export interface AddMemberDTO {
  discordId: string;
  riotId?: string | null;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  role?: number;
}
