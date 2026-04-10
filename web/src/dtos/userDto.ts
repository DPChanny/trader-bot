import type { DiscordUserDTO } from "./discordDto";

export interface UserDTO {
  discordId: string;
}

export interface UserDetailDTO extends UserDTO {
  discordUser: DiscordUserDTO;
}
