import { useCallback, useMemo } from "preact/hooks";
import { route, useRouter } from "preact-router";

function getParsedRouterUrl(routerUrl?: string) {
  const currentUrl =
    routerUrl ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  return new URL(currentUrl, window.location.origin);
}

export function useActiveGuildRoute() {
  const [router] = useRouter();
  const url = router.url;

  return useMemo(() => {
    const parsedUrl = getParsedRouterUrl(url);
    const guildMatch = parsedUrl.pathname.match(/^\/guild\/([^\/]+)/);
    const presetMatch = parsedUrl.pathname.match(/\/preset\/(\d+)/);

    return {
      activeGuildId: guildMatch ? (guildMatch[1] ?? null) : null,
      selectedPresetId: presetMatch ? parseInt(presetMatch[1]!, 10) : null,
    };
  }, [url]);
}

export function useSideMenuUrlState() {
  const [router] = useRouter();
  const url = router.url;

  const isOpen = useMemo(() => {
    const parsedUrl = getParsedRouterUrl(url);
    return parsedUrl.searchParams.get("menu") === "open";
  }, [url]);

  const setOpen = useCallback(
    (open: boolean) => {
      const parsedUrl = getParsedRouterUrl(url);

      if (open) {
        parsedUrl.searchParams.set("menu", "open");
      } else {
        parsedUrl.searchParams.delete("menu");
      }

      route(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`, true);
    },
    [url],
  );

  return {
    isOpen,
    setOpen,
  };
}
