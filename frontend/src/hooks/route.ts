import { useMemo } from "preact/hooks";
import { useRouter, route } from "preact-router";
import { extractRouteParams, Routes } from "@utils/routes";

export function useRoutePath(): string {
  const [router] = useRouter();
  return useMemo(
    () => new URL(router.url, window.location.origin).pathname,
    [router.url],
  );
}

export function useRouteQueryParam(name: string): string | null {
  const [router] = useRouter();
  return useMemo(() => {
    const url = new URL(router.url, window.location.origin);
    return url.searchParams.get(name);
  }, [router.url, name]);
}

function useRequiredRouteParam<T>(value: T | null): T {
  if (value === null) {
    setTimeout(() => route(Routes.home.to, true), 0);
    throw new Promise(() => {});
  }
  return value;
}

export function useOptionalGuildId(): string | null {
  const path = useRoutePath();
  return useMemo(() => {
    const params = extractRouteParams(Routes.guild.basePattern, path);
    return params ? (params["guildId"] ?? null) : null;
  }, [path]);
}

export function useGuildId(): string {
  return useRequiredRouteParam(useOptionalGuildId());
}

export function useOptionalPresetId(): number | null {
  const path = useRoutePath();
  return useMemo(() => {
    const params = extractRouteParams(Routes.guild.presetBasePattern, path);
    return params?.presetId ? parseInt(params.presetId, 10) : null;
  }, [path]);
}

export function usePresetId(): number {
  return useRequiredRouteParam(useOptionalPresetId());
}

export function useAuctionId(): string {
  const path = useRoutePath();
  const auctionId = useMemo(() => {
    const params = extractRouteParams(Routes.guild.auction.pattern, path);
    return params ? (params["auctionId"] ?? null) : null;
  }, [path]);
  return useRequiredRouteParam(auctionId);
}
