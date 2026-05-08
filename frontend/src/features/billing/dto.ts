import type { BaseEntityDTO } from "@utils/dto";

export interface BillingDTO extends BaseEntityDTO {
  billingId: number;
  userId: string;
  name: string;
}

export interface RegisterBillingDTO {
  authKey: string;
}
