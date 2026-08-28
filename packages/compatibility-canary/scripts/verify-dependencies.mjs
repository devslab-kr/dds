import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(packageRoot, "../..");
const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
const matrix = JSON.parse(
  await readFile(resolve(packageRoot, "compatibility-matrix.json"), "utf8"),
);
const rootManifest = JSON.parse(await readFile(resolve(workspaceRoot, "package.json"), "utf8"));
const lockfile = await readFile(resolve(workspaceRoot, "pnpm-lock.yaml"), "utf8");

const expected = { ...matrix.runtime, ...matrix.toolchain };
const declared = { ...manifest.dependencies, ...manifest.devDependencies };
const forbiddenRange = /^(?:\^|~|>|<|\*|latest$|next$|workspace:|catalog:)/i;

assert.deepEqual(declared, expected, "package.json must exactly match compatibility-matrix.json");

for (const [name, version] of Object.entries(declared)) {
  assert.equal(
    forbiddenRange.test(version),
    false,
    `${name} must use an exact version, received ${version}`,
  );
  assert.match(
    lockfile,
    new RegExp(`(?:'${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}'|${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}):\\r?\\n\\s+specifier: ${version.replaceAll(".", "\\.")}`),
    `${name}@${version} is missing from the canary lockfile importer`,
  );

  const installedManifest = resolve(packageRoot, "node_modules", ...name.split("/"), "package.json");
  const installed = JSON.parse(await readFile(installedManifest, "utf8"));
  assert.equal(installed.version, version, `${name} installed version drifted from ${version}`);
}

for (const [label, candidate] of [
  ["workspace", rootManifest],
  ["canary", manifest],
]) {
  assert.equal(candidate.pnpm?.overrides, undefined, `${label} package.json cannot override peers`);
  assert.equal(
    candidate.pnpm?.peerDependencyRules,
    undefined,
    `${label} package.json cannot suppress peer dependency diagnostics`,
  );
}

assert.match(lockfile, /packages\/compatibility-canary:/, "canary lockfile importer is missing");
assert.doesNotMatch(lockfile, /peerDependencyRules:|overrides:/, "lockfile contains dependency overrides");

console.log(`verified ${Object.keys(declared).length} exact canary dependencies`);
