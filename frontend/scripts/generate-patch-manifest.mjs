import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

const notesDir = path.join(frontendRoot, "public", "patches", "notes");
const plansDir = path.join(frontendRoot, "public", "patches", "plans");
const outputPath = path.join(
  frontendRoot,
  "public",
  "patches",
  "manifest.json",
);

async function listVersions(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/i, ""))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function main() {
  const [notes, plans] = await Promise.all([
    listVersions(notesDir),
    listVersions(plansDir),
  ]);

  const content = `${JSON.stringify({ notes, plans }, null, 2)}\n`;

  await fs.writeFile(outputPath, content, "utf8");
  console.log(
    `Generated patch manifest: ${path.relative(frontendRoot, outputPath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
