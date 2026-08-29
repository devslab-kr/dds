import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packages = ["dds-tokens", "dds-css", "dds-icons", "dds-solid", "site-kit"];
for (const packageName of packages) {
  const manifest = JSON.parse(
    await readFile(new URL(`../packages/${packageName}/package.json`, import.meta.url), "utf8"),
  );
  assert.equal(manifest.name, `@devslab/${packageName}`);
  assert.equal(manifest.publishConfig?.registry, "https://registry.npmjs.org/");
  assert.equal(manifest.publishConfig?.access, "restricted");
  assert.equal(manifest.publishConfig?.provenance, false);
}

const workspace = fileURLToPath(new URL("..", import.meta.url));
const ignored = new Set([".git", "node_modules", "dist", "storybook-static"]);
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else {
      const content = await readFile(path, "utf8").catch(() => "");
      assert.doesNotMatch(content, /@devslab-kr\/dds-(?:tokens|css|icons)/, `legacy package scope remains in ${path}`);
    }
  }
}
await scan(workspace);

console.log(`verified ${packages.length} final @devslab package names`);
