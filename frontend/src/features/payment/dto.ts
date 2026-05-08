import type { BaseEntityDTO } from "@utils/dto";
import type { BillingDTO } from "@features/billing/dto";
import type { GuildDTO } from "@features/guild/dto";
import type { Plan } from "@features/subscription/dto";

export interface PaymentDTO extends BaseEntityDTO {
  paymentId: number;
  guildId: string | null;
  userId: string;
  billingId: number | null;
  orderId: string;
  paymentKey: string | null;
  plan: Plan;
  amount: number;
}

export interface PaymentDetailDTO extends PaymentDTO {
  guild: GuildDTO | null;
  billing: BillingDTO | null;
}
