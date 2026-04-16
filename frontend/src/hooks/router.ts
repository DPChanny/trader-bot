import { useMemo } from "preact/hooks";
import { useRouter } from "preact-router";

function getRouterUrl(routerUrl?: string) {
  const currentUrl =
    routerUrl ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  return new URL(currentUrl, window.location.origin);
}

export function useGuildId() {
  const [router] = useRouter();
  const url = router.url;

  return useMemo(() => {
    const parsedUrl = getRouterUrl(url);
    const match = parsedUrl.pathname.match(/^\/guild\/([^\/]+)/);
    return match ? match[1]! : null;
  }, [url]);
}

export function usePresetId() {
  const [router] = useRouter();
  const url = router.url;

  return useMemo(() => {
    const parsedUrl = getRouterUrl(url);
    const match = parsedUrl.pathname.match(/\/preset\/(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  }, [url]);
}
