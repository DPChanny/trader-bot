export interface MemberDTO {
  memberId: number;
  guildId: number;
  alias: string | null;
  riotId: string | null;
  discordId: string | null;
  profileUrl: string | null;
}

export interface AddMemberDTO {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

export interface UpdateMemberDTO {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}
