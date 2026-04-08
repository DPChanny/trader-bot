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
  discord: DiscordDTO | null;
  profileUrl: string | null;
}

export interface AddMemberDTO {
  riotId?: string | null;
  discordId?: string | null;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  discordId?: string | null;
}
