import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

const publicDir = path.join(frontendRoot, "public");
const outputPath = path.join(frontendRoot, "public", "manifest.json");

async function listPublicFiles(dirPath, rootPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return listPublicFiles(entryPath, rootPath);
      }

      if (!entry.isFile()) {
        return [];
      }

      const relativePath = path
        .relative(rootPath, entryPath)
        .split(path.sep)
        .join("/");

      if (relativePath === "manifest.json") {
        return [];
      }

      return [`/${relativePath}`];
    }),
  );

  return nested.flat();
}

async function getPublicFiles() {
  try {
    const files = await listPublicFiles(publicDir, publicDir);
    return files.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
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
  const files = await getPublicFiles();
  const content = `${JSON.stringify({ files }, null, 2)}\n`;

  await fs.writeFile(outputPath, content, "utf8");
  console.log(
    `Generated public manifest: ${path.relative(frontendRoot, outputPath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
