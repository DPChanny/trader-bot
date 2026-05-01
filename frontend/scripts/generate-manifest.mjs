import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

const publicDir = path.join(frontendRoot, "public");
const outputPath = path.join(publicDir, "manifest.json");

async function extractTitle(filePath) {
  const content = await fsPromises.readFile(filePath, "utf8");
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

async function getAnnouncements() {
  const dirPath = path.join(publicDir, "announcements");
  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const match = entry.name.match(/^(\d+)/);
        if (match) {
          const id = parseInt(match[1], 10);
          const title = await extractTitle(path.join(dirPath, entry.name));
          items.push({ id, path: `/announcements/${entry.name}`, title });
        }
      }
    }
    items.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function getNotes(phase) {
  const dirPath = path.join(publicDir, "patches", "notes", phase);
  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const version = entry.name.slice(0, -3);
        items.push({ version, path: `/patches/notes/${phase}/${entry.name}` });
      }
    }
    items.sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function getPlans() {
  const dirPath = path.join(publicDir, "patches", "plans");
  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const version = entry.name.slice(0, -3);
        items.push({ version, path: `/patches/plans/${entry.name}` });
      }
    }
    items.sort((a, b) =>
      a.version.localeCompare(b.version, undefined, { numeric: true }),
    );
    return items;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function generate() {
  const manifest = {
    announcements: await getAnnouncements(),
    patches: {
      notes: {
        beta: await getNotes("beta"),
        prod: await getNotes("prod"),
      },
      plans: await getPlans(),
    },
  };

  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  await fsPromises.writeFile(outputPath, content, "utf8");
  console.log(
    `Generated public manifest: ${path.relative(frontendRoot, outputPath)}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes("--watch");

  await generate();

  if (isWatch) {
    console.log(`Watching for changes in ${publicDir}...`);
    let timeoutId = null;

    fs.watch(publicDir, { recursive: true }, (eventType, filename) => {
      if (
        !filename ||
        filename === "manifest.json" ||
        !filename.endsWith(".md")
      ) {
        return;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        console.log(
          `[${eventType}] ${filename} changed. Regenerating manifest...`,
        );
        generate().catch(console.error);
        timeoutId = null;
      }, 300);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
