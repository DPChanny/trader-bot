export interface UserDTO {
  discordId: string;
  name: string;
  avatarHash: string | null;
}

export interface UserDetailDTO extends UserDTO {
  avatarUrl: string | null;
}
