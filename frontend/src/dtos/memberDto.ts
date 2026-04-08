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
  discordId: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  discord: DiscordDTO | null;
}

export interface AddMemberDTO {
  riotId?: string | null;
  discordId?: string | null;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  discordId?: string | null;
}
