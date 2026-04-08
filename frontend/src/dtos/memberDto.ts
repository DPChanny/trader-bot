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
}

export interface MemberDetailDTO extends MemberDTO {
  discord: DiscordDTO | null;
}

export interface AddMemberDTO {
  discordId: string;
  riotId?: string | null;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
}
