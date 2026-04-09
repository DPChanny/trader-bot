export interface MemberDTO {
  memberId: number;
  guildId: number;
  discordId: string;
  role: number;
  riotId: string | null;
  name: string;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
}

export type MemberDetailDTO = MemberDTO;

export interface AddMemberDTO {
  discordId: string;
  riotId?: string | null;
}

export interface UpdateMemberDTO {
  riotId?: string | null;
  alias?: string | null;
  role?: number;
}
