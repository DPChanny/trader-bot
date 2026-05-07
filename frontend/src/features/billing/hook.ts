import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { BillingDTO } from "@features/billing/dto";
import { AppError, FrontendErrorCode } from "@utils/error";
import { queryKeys } from "@utils/query";
import {
  getBillings,
  registerBilling,
  deleteBilling,
  requestBillingAuth,
} from "./api";

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
    const opener = window.opener as Window | null;

    // v2: Toss redirects to failUrl with ?code=...&message=... on failure/cancel
    const code = params.get("code");
    if (code !== null) {
      if (opener) {
        const type =
          code === "PAY_PROCESS_CANCELED"
            ? "BILLING_AUTH_CANCELED"
            : "BILLING_AUTH_ERROR";
        opener.postMessage({ type }, window.location.origin);
        window.close();
      } else {
        const redirect = sessionStorage.getItem("billingAuthRedirect") ?? "/me";
        sessionStorage.removeItem("billingAuthRedirect");
        void navigate({ to: redirect, replace: true });
      }
      return;
    }

    if (!authKey) {
      setError(new AppError(FrontendErrorCode.Unexpected.External));
      return;
    }

    registerBilling({ authKey })
      .then((data) => {
        if (opener) {
          opener.postMessage(
            { type: "BILLING_AUTH_SUCCESS", billing: data },
            window.location.origin,
          );
          window.close();
        } else {
          queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
            old ? [...old, data] : [data],
          );
          const redirect =
            sessionStorage.getItem("billingAuthRedirect") ?? "/me";
          sessionStorage.removeItem("billingAuthRedirect");
          void navigate({ to: redirect, replace: true });
        }
      })
      .catch((e: unknown) => {
        if (opener) {
          opener.postMessage(
            { type: "BILLING_AUTH_ERROR" },
            window.location.origin,
          );
          window.close();
        } else {
          setError(
            e instanceof AppError
              ? e
              : new AppError(FrontendErrorCode.Unexpected.External),
          );
        }
      });
  }, []);

  return { error };
}

export function useRequestBillingAuth() {
  const queryClient = useQueryClient();

  return useCallback(
    async ({ customerKey }: { customerKey: string }) => {
      try {
        const billing = await requestBillingAuth({ customerKey });
        queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
          old ? [...old, billing] : [billing],
        );
      } catch (e) {
        if (e === null) return; // silently cancelled
        throw e;
      }
    },
    [queryClient],
  );
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
