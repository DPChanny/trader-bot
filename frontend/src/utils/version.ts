export type PatchKind = "notes" | "plans";

function getPatchPrefix(kind: PatchKind): string {
  return kind === "notes" ? "/patches/notes/" : "/patches/plans/";
}

export function getPatchVersions(files: string[], kind: PatchKind): string[] {
  const prefix = getPatchPrefix(kind);
  const versions = files
    .filter(
      (filePath) => filePath.startsWith(prefix) && filePath.endsWith(".md"),
    )
    .map((filePath) => filePath.slice(prefix.length, -3))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return kind === "notes" ? versions.reverse() : versions;
}

export function getLatestPatchNoteVersion(files: string[]): string {
  return getPatchVersions(files, "notes")[0] ?? "";
}
