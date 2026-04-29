import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  fetchNextPage: () => void,
  hasNextPage: boolean,
  deps: unknown[],
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage) return;
    if (el.scrollHeight <= el.clientHeight) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, fetchNextPage, ...deps]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      hasNextPage &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100
    ) {
      fetchNextPage();
    }
  };

  return { scrollRef, onScroll };
}
