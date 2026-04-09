import type { DiscordDTO } from "./discordDto";

export interface UserDTO {
  userId: number;
  discordId: string;
}

export interface UserDetailDTO extends UserDTO {
  discord: DiscordDTO;
}
