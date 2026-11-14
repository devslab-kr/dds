import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const manifestPath = new URL("../packages/dds-auth/package.json", import.meta.url);
const source = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(source);

// Changesets' ignore option controls versioning; publish still queries every non-private package.
// DDS Auth is released separately to GitHub Packages, so exclude it for this invocation only.
if (manifest.name !== "@devslab-kr/dds-auth" || manifest.publishConfig?.registry !== "https://npm.pkg.github.com") {
  throw new Error("Unexpected DDS Auth manifest");
}

try {
  writeFileSync(manifestPath, JSON.stringify({ ...manifest, private: true }, null, 2) + "\n");
  const result = spawnSync(process.execPath, [require.resolve("@changesets/cli/bin.js"), "publish", ...process.argv.slice(2)], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  writeFileSync(manifestPath, source);
}
