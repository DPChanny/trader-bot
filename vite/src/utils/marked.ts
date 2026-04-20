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

export function getNotes(files: string[]): string[] {
  return getMarkedNames(files, "/patches/notes/", { sort: "desc" });
}

export function getPlans(files: string[]): string[] {
  return getMarkedNames(files, "/patches/plans/");
}
