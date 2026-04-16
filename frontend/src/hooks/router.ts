import { useMemo } from "preact/hooks";
import { useRouter } from "preact-router";

export function useGuildId() {
  const [router] = useRouter();
  const url = new URL(router.url, window.location.origin);

  return useMemo(() => {
    const match = url.pathname.match(/^\/guild\/([^\/]+)/);
    return match ? match[1]! : null;
  }, [url]);
}

export function usePresetId() {
  const [router] = useRouter();
  const url = new URL(router.url, window.location.origin);

  return useMemo(() => {
    const match = url.pathname.match(/\/preset\/(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  }, [url]);
}
