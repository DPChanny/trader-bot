import { queryOptions, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marked } from "marked";
import { queryKeys } from "@utils/query";
import { Phase } from "@utils/env";

export type AnnouncementMeta = {
  id: string;
  path: string;
  title: string;
};

export type PatchMeta = {
  version: string;
  path: string;
};

export type Manifest = {
  announcements: AnnouncementMeta[];
  patches: {
    notes: Record<Phase, PatchMeta[]>;
    plans: PatchMeta[];
  };
};

export async function fetchManifest(): Promise<Manifest | null> {
  try {
    const response = await fetch("/manifest.json");
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Manifest;
  } catch {
    return null;
  }
}

export function manifestQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.manifest(),
    queryFn: fetchManifest,
  });
}

export function useManifest(): UseQueryResult<Manifest | null, Error> {
  return useQuery(manifestQueryOptions());
}

export async function fetchMarked(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    const markedSource = await response.text();
    return marked.parse(markedSource, {
      gfm: true,
      async: false,
    }) as string;
  } catch {
    return null;
  }
}

export function markedQueryOptions(path: string) {
  return queryOptions({
    queryKey: ["marked", path] as const,
    queryFn: () => fetchMarked(path),
    staleTime: Infinity,
  });
}

export function useMarked(path: string): UseQueryResult<string | null, Error> {
  return useQuery({
    ...markedQueryOptions(path),
    enabled: !!path,
  });
}
