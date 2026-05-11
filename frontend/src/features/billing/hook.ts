import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BillingDTO } from "@features/billing/dto";
import { AppError, FrontendErrorCode } from "@utils/error";
import { queryKeys, queryStaleTimes } from "@utils/query";
import {
  getBillings,
  registerBilling,
  deleteBilling,
  requestBilling,
} from "./api";

export function useBillingCallback({
  authKey,
  code,
}: {
  authKey: string | undefined;
  code: string | undefined;
}): {
  error: AppError | null;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const called = useRef(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isPending, setIsPending] = useState(authKey !== undefined);

  useEffect(() => {
    if (called.current) return;
    if (authKey === undefined && code === undefined) return;
    called.current = true;

    if (code !== undefined) {
      if (code !== "PAY_PROCESS_CANCELED") {
        setError(new AppError(FrontendErrorCode.Unexpected.External));
      }
      setIsPending(false);
      return;
    }

    if (!authKey) {
      setError(new AppError(FrontendErrorCode.Unexpected.External));
      setIsPending(false);
      return;
    }

    registerBilling({ authKey })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.billings() });
      })
      .catch((e: unknown) => {
        setError(
          e instanceof AppError
            ? e
            : new AppError(FrontendErrorCode.Unexpected.External),
        );
      })
      .finally(() => {
        setIsPending(false);
      });
  }, []);

  return { error, isPending };
}

export function useRequestBilling(): {
  requestBilling: ({ customerKey }: { customerKey: string }) => void;
} {
  const request = useCallback(({ customerKey }: { customerKey: string }) => {
    void requestBilling({ customerKey });
  }, []);

  return { requestBilling: request };
}

export function useBillings(): UseQueryResult<BillingDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.billings(),
    queryFn: getBillings,
    staleTime: queryStaleTimes.interactive,
  });
}

export function useDeleteBilling(): UseMutationResult<
  Awaited<ReturnType<typeof deleteBilling>>,
  AppError,
  Parameters<typeof deleteBilling>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBilling,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billings() });
    },
  });
}
