import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { BillingDTO } from "@features/billing/dto";
import { AppError, FrontendErrorCode } from "@utils/error";
import { queryKeys } from "@utils/query";
import { getBillings, registerBilling, deleteBilling } from "./api";

function isRedirectPath(path: string | null): path is string {
  return (
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
  );
}

export function useBillingCallback() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const called = useRef(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const authKey = params.get("authKey");
    const redirect = params.get("redirect");

    if (!isRedirectPath(redirect)) {
      setError(new AppError(FrontendErrorCode.Unexpected.External));
      return;
    }

    // v2: Toss redirects to failUrl with ?code=...&message=... on failure/cancel
    const code = params.get("code");
    if (code !== null) {
      if (code === "PAY_PROCESS_CANCELED") {
        void navigate({ to: redirect, replace: true });
      } else {
        setError(new AppError(FrontendErrorCode.Unexpected.External));
      }
      return;
    }

    if (!authKey) {
      setError(new AppError(FrontendErrorCode.Unexpected.External));
      return;
    }

    registerBilling({ authKey })
      .then((data) => {
        queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
          old ? [...old, data] : [data],
        );
        void navigate({ to: redirect, replace: true });
      })
      .catch((e: unknown) => {
        setError(
          e instanceof AppError
            ? e
            : new AppError(FrontendErrorCode.Unexpected.External),
        );
      });
  }, []);

  return { error };
}

export function useBillings(): UseQueryResult<BillingDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.billings(),
    queryFn: getBillings,
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
    onSuccess: (_, variables) => {
      queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
        old?.filter((b) => b.billingId !== variables.billingId),
      );
    },
  });
}
