export type PublicPatchManifest = {
  notes: string[];
  plans: string[];
};

const EMPTY_PATCH_MANIFEST: PublicPatchManifest = {
  notes: [],
  plans: [],
};

export async function loadPublicPatchManifest(): Promise<PublicPatchManifest> {
  try {
    const response = await fetch("/patches/manifest.json");
    if (!response.ok) {
      return EMPTY_PATCH_MANIFEST;
    }

    const data = (await response.json()) as Partial<PublicPatchManifest>;
    return {
      notes: Array.isArray(data.notes)
        ? data.notes.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      plans: Array.isArray(data.plans)
        ? data.plans.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };
  } catch {
    return EMPTY_PATCH_MANIFEST;
  }
}
