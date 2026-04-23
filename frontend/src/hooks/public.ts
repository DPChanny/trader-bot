import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
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

const EMPTY_MANIFEST: Manifest = {
  announcements: [],
  patches: {
    notes: { beta: [], prod: [] },
    plans: [],
  },
};

async function fetchManifest(): Promise<Manifest> {
  try {
    const response = await fetch("/manifest.json");
    if (!response.ok) {
      return EMPTY_MANIFEST;
    }

    return (await response.json()) as Manifest;
  } catch {
    return EMPTY_MANIFEST;
  }
}

export function useManifest(): UseQueryResult<Manifest, Error> {
  return useQuery({
    queryKey: queryKeys.manifest(),
    queryFn: fetchManifest,
  });
}

async function fetchMarked(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return "";
    }

    const markedSource = await response.text();
    return marked.parse(markedSource, {
      gfm: true,
      async: false,
    });
  } catch {
    return "";
  }
}

export function useMarked(path: string): UseQueryResult<string, Error> {
  return useQuery({
    queryKey: ["marked", path] as const,
    queryFn: () => fetchMarked(path),
  });
}
