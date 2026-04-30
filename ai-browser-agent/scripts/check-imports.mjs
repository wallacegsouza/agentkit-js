import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve("src");
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
}

await walk(root);
const missing = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  const imports = [...source.matchAll(/from\s+["'](\.[^"']+)["']/g)].map((match) => match[1]);
  for (const specifier of imports) {
    const target = resolve(dirname(file), specifier);
    try {
      await readFile(target);
    } catch {
      missing.push(`${file} -> ${specifier}`);
    }
  }
}

if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}

console.log(`OK: ${files.length} JS files checked.`);
