import { useMemo } from "preact/hooks";
import { useRouter } from "preact-router";

function getParsedRouterUrl(routerUrl?: string) {
  const currentUrl =
    routerUrl ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  return new URL(currentUrl, window.location.origin);
}

export function useGuildRoute() {
  const [router] = useRouter();
  const url = router.url;

  return useMemo(() => {
    const parsedUrl = getParsedRouterUrl(url);
    const guildMatch = parsedUrl.pathname.match(/^\/guild\/([^\/]+)/);
    const presetMatch = parsedUrl.pathname.match(/\/preset\/(\d+)/);

    return {
      guildId: guildMatch ? (guildMatch[1] ?? null) : null,
      presetId: presetMatch ? parseInt(presetMatch[1]!, 10) : null,
    };
  }, [url]);
}
