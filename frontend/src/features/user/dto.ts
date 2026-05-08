import type { BaseEntityDTO } from "@utils/dto";

export interface UserDTO extends BaseEntityDTO {
  discordId: string;
  name: string;
  avatarHash: string | null;
}

export interface UserDetailDTO extends UserDTO {
  avatarUrl: string | null;
}
