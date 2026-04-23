import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Routes } from "@utils/routes";

export function useRoutePath(): string {
  const location = useLocation();
  return location.pathname;
}

export function useRouteQueryParam(name: string): string | null {
  const search = useLocation({ select: (loc) => loc.search as Record<string, string> });
  return search[name] ?? null;
}

function useRequiredRouteParam<T>(value: T | null | undefined): T {
  const navigate = useNavigate();
  if (value == null) {
    setTimeout(() => navigate({ to: Routes.home.to, replace: true }), 0);
    throw new Promise(() => {});
  }
  return value;
}

export function useOptionalGuildId(): string | null {
  const params = useParams({ strict: false });
  return params.guildId ?? null;
}

export function useGuildId(): string {
  return useRequiredRouteParam(useOptionalGuildId());
}

export function useOptionalPresetId(): number | null {
  const params = useParams({ strict: false });
  return params.presetId ? parseInt(params.presetId as string, 10) : null;
}

export function usePresetId(): number {
  return useRequiredRouteParam(useOptionalPresetId());
}

export function useAuctionId(): string {
  const params = useParams({ strict: false });
  return useRequiredRouteParam(params.auctionId as string | undefined);
}
