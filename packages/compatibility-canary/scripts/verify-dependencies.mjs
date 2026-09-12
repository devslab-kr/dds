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

/* The matrix documents third-party *compatibility* — a version some other
   team published and we are proving works with the rest of the stack.
   A `@devslab/*` dependency is a sibling package in this monorepo: its
   version tracks the same lockstep train as the canary itself, and a
   `workspace:` specifier carries no compatibility claim to verify. So
   first-party names are exempt from the matrix comparison and the
   exact-pin check below, and are held to a narrower, positive rule
   instead: the specifier must use the `workspace:` protocol AND name the
   exact lockstep version currently linked, so neither a published range
   (e.g. "^0.10.0") nor an unpinned one (e.g. "workspace:*" or
   "workspace:^0.10.0" — what `pnpm add --workspace` writes by default)
   passes silently. */
const isFirstPartyDependency = (name) => name.startsWith("@devslab/");

const declaredEntries = Object.entries(declared);
const firstPartyDeclared = Object.fromEntries(declaredEntries.filter(([name]) => isFirstPartyDependency(name)));
const thirdPartyDeclared = Object.fromEntries(declaredEntries.filter(([name]) => !isFirstPartyDependency(name)));

assert.deepEqual(thirdPartyDeclared, expected, "package.json must exactly match compatibility-matrix.json");

function assertLockfileSpecifier(name, version) {
  const escapedName = name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  assert.match(
    lockfile,
    new RegExp(`(?:'${escapedName}'|${escapedName}):\\r?\\n\\s+specifier: ${version.replaceAll(".", "\\.")}`),
    `${name}@${version} is missing from the canary lockfile importer`,
  );
}

for (const [name, version] of Object.entries(firstPartyDeclared)) {
  assert.ok(
    version.startsWith("workspace:"),
    `${name} is a first-party DDS package and must use the workspace: protocol, received ${version}`,
  );
  assertLockfileSpecifier(name, version);

  const pinned = version.slice("workspace:".length);
  const installedManifest = resolve(packageRoot, "node_modules", ...name.split("/"), "package.json");
  const installed = JSON.parse(await readFile(installedManifest, "utf8"));
  assert.equal(
    installed.version,
    pinned,
    `${name} must name the linked lockstep version, declared ${version}, linked ${installed.version}`,
  );
}

for (const [name, version] of Object.entries(thirdPartyDeclared)) {
  assert.equal(
    forbiddenRange.test(version),
    false,
    `${name} must use an exact version, received ${version}`,
  );
  assertLockfileSpecifier(name, version);

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

console.log(
  `verified ${Object.keys(thirdPartyDeclared).length} exact canary dependencies and ${Object.keys(firstPartyDeclared).length} first-party workspace link(s)`,
);
