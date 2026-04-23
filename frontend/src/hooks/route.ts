import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { extractRouteParams, Routes } from "@utils/routes";

export function useRoutePath(): string {
  const location = useLocation();
  return location.pathname;
}

export function useRouteQueryParam(name: string): string | null {
  const location = useLocation();
  return useMemo(() => {
    return new URLSearchParams(location.search).get(name);
  }, [location.search, name]);
}

function useRequiredRouteParam<T>(value: T | null): T {
  const navigate = useNavigate();
  if (value === null) {
    setTimeout(() => navigate(Routes.home.to, { replace: true }), 0);
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
