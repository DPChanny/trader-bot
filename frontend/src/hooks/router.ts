import { useMemo } from "preact/hooks";
import { useRouter } from "preact-router";
import { FrontendErrorCode, handleAppError } from "@utils/error";

export function useRoutePath() {
  const [router] = useRouter();
  return useMemo(
    () => new URL(router.url, window.location.origin).pathname,
    [router.url],
  );
}

function getRequiredRouteParam<T>(value: T | null): T {
  if (value === null) {
    handleAppError(FrontendErrorCode.Unexpected.Internal);
  }

  return value;
}

export function useOptionalGuildId() {
  const routePath = useRoutePath();

  return useMemo(() => {
    const match = routePath.match(/^\/guild\/([^\/]+)/);
    return match ? match[1]! : null;
  }, [routePath]);
}

export function useGuildId() {
  return getRequiredRouteParam(useOptionalGuildId());
}

export function useOptionalPresetId() {
  const routePath = useRoutePath();

  return useMemo(() => {
    const match = routePath.match(/\/preset\/(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  }, [routePath]);
}

export function usePresetId() {
  return getRequiredRouteParam(useOptionalPresetId());
}

export function useAuctionId() {
  const routePath = useRoutePath();

  return useMemo(() => {
    const match = routePath.match(/^\/auction\/([^\/]+)/);
    return getRequiredRouteParam(match ? match[1]! : null);
  }, [routePath]);
}
