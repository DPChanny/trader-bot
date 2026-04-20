import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
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

    const data = (await response.json()) as Partial<Manifest>;
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
