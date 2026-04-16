import { useMemo } from "preact/hooks";
import { useRouter } from "preact-router";

function useRoutePathname() {
  const [router] = useRouter();
  return useMemo(
    () => new URL(router.url, window.location.origin).pathname,
    [router.url],
  );
}

function getRequiredRouteParam<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`${name} is not available on the current route.`);
  }

  return value;
}

export function useOptionalGuildId() {
  const pathname = useRoutePathname();

  return useMemo(() => {
    const match = pathname.match(/^\/guild\/([^\/]+)/);
    return match ? match[1]! : null;
  }, [pathname]);
}

export function useGuildId() {
  return getRequiredRouteParam(useOptionalGuildId(), "guildId");
}

export function useOptionalPresetId() {
  const pathname = useRoutePathname();

  return useMemo(() => {
    const match = pathname.match(/\/preset\/(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  }, [pathname]);
}

export function usePresetId() {
  return getRequiredRouteParam(useOptionalPresetId(), "presetId");
}

export function useAuctionId() {
  const pathname = useRoutePathname();

  return useMemo(() => {
    const match = pathname.match(/^\/auction\/([^\/]+)/);
    return getRequiredRouteParam(match ? match[1]! : null, "auctionId");
  }, [pathname]);
}
