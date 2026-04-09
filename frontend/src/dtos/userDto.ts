export interface UserDTO {
  userId: number;
  discordId: string;
  name: string;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
}
