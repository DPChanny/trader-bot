export interface UserDTO {
  discordId: string;
  name: string;
  avatarHash: string | null;
  avatarUrl?: string | null;
}

export type UserDetailDTO = UserDTO;
