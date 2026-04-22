import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
import { marked } from "marked";
import { queryKeys } from "@utils/query";

export type Manifest = {
  files: string[];
};

const EMPTY_MANIFEST: Manifest = {
  files: [],
};

async function fetchManifest(): Promise<Manifest> {
  try {
    const response = await fetch("/manifest.json");
    if (!response.ok) {
      return EMPTY_MANIFEST;
    }

    const data = (await response.json()) as Partial<{ files: unknown }>;
    return {
      files: Array.isArray(data.files)
        ? data.files.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };
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

type MarkedSort = "asc" | "desc";

type MarkedNamesOptions = {
  sort?: MarkedSort;
};

function normalizePrefix(prefix: string): string {
  if (!prefix.startsWith("/")) {
    return `/${prefix.replace(/\/+$/g, "")}/`;
  }

  return `${prefix.replace(/\/+$/g, "")}/`;
}

export function getMarkedNames(
  files: string[],
  prefix: string,
  options?: MarkedNamesOptions,
): string[] {
  const normalizedPrefix = normalizePrefix(prefix);
  const sort = options?.sort ?? "asc";

  const names = files
    .filter(
      (filePath) =>
        filePath.startsWith(normalizedPrefix) && filePath.endsWith(".md"),
    )
    .map((filePath) => filePath.slice(normalizedPrefix.length, -3))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return sort === "desc" ? names.reverse() : names;
}

export function getAnnouncements(files: string[]): string[] {
  return getMarkedNames(files, "/announcements/", { sort: "desc" });
}

export function getNotes(
  files: string[],
  phase: "dev" | "beta" | "prod",
): string[] {
  return getMarkedNames(files, `/patches/notes/${phase}/`, {
    sort: "desc",
  });
}

export function getPlans(files: string[]): string[] {
  return getMarkedNames(files, "/patches/plans/");
}
