import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

const publicDir = path.join(frontendRoot, "public");
const outputPath = path.join(publicDir, "manifest.json");

async function extractTitle(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

async function getAnnouncements() {
  const dirPath = path.join(publicDir, "announcements");
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const id = entry.name.slice(0, -3);
        const title = await extractTitle(path.join(dirPath, entry.name));
        items.push({ id, path: `/announcements/${entry.name}`, title });
      }
    }
    items.sort((a, b) =>
      b.id.localeCompare(a.id, undefined, { numeric: true }),
    );
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function getNotes(phase) {
  const dirPath = path.join(publicDir, "patches", "notes", phase);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        items.push(entry.name.slice(0, -3));
      }
    }
    items.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function getPlans() {
  const dirPath = path.join(publicDir, "patches", "plans");
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        items.push(entry.name.slice(0, -3));
      }
    }
    items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  const manifest = {
    announcements: await getAnnouncements(),
    patches: {
      notes: {
        dev: await getNotes("dev"),
        beta: await getNotes("beta"),
        prod: await getNotes("prod"),
      },
      plans: await getPlans(),
    },
  };

  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(outputPath, content, "utf8");
  console.log(
    `Generated public manifest: ${path.relative(frontendRoot, outputPath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
