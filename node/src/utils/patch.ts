function getVersions(files: string[], prefix: string): string[] {
  const versions = files
    .filter(
      (filePath) => filePath.startsWith(prefix) && filePath.endsWith(".md"),
    )
    .map((filePath) => filePath.slice(prefix.length, -3))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return versions;
}

export function getNotes(files: string[]): string[] {
  return getVersions(files, "/patches/notes/").reverse();
}

export function getPlans(files: string[]): string[] {
  return getVersions(files, "/patches/plans/");
}
