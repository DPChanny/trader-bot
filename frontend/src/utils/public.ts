export type PublicManifest = {
  files: string[];
};

const EMPTY_PUBLIC_MANIFEST: PublicManifest = {
  files: [],
};

export async function loadPublicManifest(): Promise<PublicManifest> {
  try {
    const response = await fetch("/manifest.json");
    if (!response.ok) {
      return EMPTY_PUBLIC_MANIFEST;
    }

    const data = (await response.json()) as Partial<PublicManifest>;
    return {
      files: Array.isArray(data.files)
        ? data.files.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };
  } catch {
    return EMPTY_PUBLIC_MANIFEST;
  }
}
