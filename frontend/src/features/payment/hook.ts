import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PaymentDTO } from "@features/payment/dto";
import type { AppError } from "@utils/error";
import { queryKeys } from "@utils/query";
import { getPayments } from "./api";

export function usePayments(
  guildId: string,
): UseQueryResult<PaymentDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.payments(guildId),
    queryFn: () => getPayments(guildId),
  });
}
