import type { DiscordUserDTO } from "./discordUserDto";

export interface UserDTO {
  discordId: string;
}

export interface UserDetailDTO extends UserDTO {
  discordUser: DiscordUserDTO;
}
