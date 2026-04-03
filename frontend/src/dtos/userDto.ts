export interface UserDTO {
  userId: number;
  discordId: string;
  name: string;
}

export interface AddUserDTO {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

export interface UpdateUserDTO {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}
