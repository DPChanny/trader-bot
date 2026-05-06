import type { Tier } from "@features/subscription/dto";

export interface PaymentDTO {
  paymentId: number;
  guildId: string | null;
  userId: string;
  orderId: string;
  paymentKey: string | null;
  tier: Tier;
}
