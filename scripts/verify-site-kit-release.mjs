import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const workspace = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const temp = await mkdtemp(join(tmpdir(), "site-kit-release-"));
const npmCli = process.platform === "win32" ? process.execPath : "npm";
const npmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")] : [];
const pnpmCli = process.platform === "win32" ? process.execPath : "pnpm";
const pnpmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules", "corepack", "dist", "pnpm.js")] : [];
const run = (args, cwd) => {
  const result = spawnSync(npmCli, [...npmPrefix, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: join(temp, ".npm-cache") },
  });
  if (result.status !== 0) throw new Error(`${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};
const runPnpm = (args, cwd) => {
  const result = spawnSync(pnpmCli, [...pnpmPrefix, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.status !== 0) throw new Error(`pnpm ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};
// `npm publish --dry-run` still asks the registry whether the version exists and
// refuses one that is already published. On main right after a release that is
// the normal state, not a defect — the pack, the manifest and the fresh-consumer
// install are what this gate checks — so "already published" counts as passed.
const publishDryRun = (tarball, cwd) => {
  const result = spawnSync(npmCli, [...npmPrefix, "publish", tarball, "--dry-run", "--json", "--ignore-scripts"], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: join(temp, ".npm-cache") },
  });
  if (result.status === 0) return;
  const output = `${result.stdout}\n${result.stderr}`;
  if (/cannot publish over the previously published versions/i.test(output)) {
    console.log(`${basename(tarball)} is already on npm; publish dry-run skipped`);
    return;
  }
  throw new Error(`publish ${basename(tarball)} --dry-run failed\n${output}`);
};

try {
  const packageNames = ["dds-tokens", "dds-css", "dds-icons", "dds-solid", "site-kit"];
  const tarballs = [];
  let siteKitTarball = "";
  for (const packageName of packageNames) {
    const packageRoot = join(workspace, "packages", packageName);
    const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    runPnpm(["pack", "--pack-destination", temp], packageRoot);
    const tarball = join(temp, `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`);
    tarballs.push(tarball);
    if (packageName === "site-kit") siteKitTarball = tarball;
  }
  const packageRoot = join(workspace, "packages", "site-kit");
  const bundle = await readFile(join(packageRoot, "dist", "solid.js"), "utf8");
  assert.match(bundle, /from\s+["']@devslab\/dds-solid["']/, "site-kit must externalize dds-solid");
  publishDryRun(siteKitTarball, packageRoot);
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }), "utf8");
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], temp);
  const installedRoot = join(temp, "node_modules", "@devslab", "site-kit");
  const manifest = JSON.parse(await readFile(join(installedRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "@devslab/site-kit");
  for (const path of [
    "dist/solid.js", "dist/index.d.ts",
    "src/core/index.mjs", "src/core/index.d.mts",
    "src/core/flags.mjs", "src/core/flags.d.mts",
    "src/tanstack-start.mjs", "src/tanstack-start.d.mts",
    "styles.css", "flags/LICENSE-flag-icons.txt",
  ]) {
    await access(join(installedRoot, path));
  }
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  const core = await import(pathToFileURL(join(installedRoot, "src", "core", "index.mjs")));
  assert.equal(core.LOCALES.length, 14);
  assert.equal(
    typeof (await import(pathToFileURL(join(installedRoot, "src", "core", "flags.mjs")))).flagFor,
    "function",
    "src/core/flags.mjs must export flagFor",
  );
  assert.ok(manifest.exports["./flags"], "package.json exports must declare a ./flags subpath");
  const subpathProbe = join(temp, "resolve-flags-subpath.mjs");
  await writeFile(
    subpathProbe,
    'import { flagFor } from "@devslab/site-kit/flags";\nif (typeof flagFor !== "function") throw new Error("@devslab/site-kit/flags did not resolve to flagFor");\n',
    "utf8",
  );
  const subpathResult = spawnSync(process.execPath, [subpathProbe], { cwd: temp, encoding: "utf8" });
  if (subpathResult.status !== 0) throw new Error(`@devslab/site-kit/flags subpath resolution failed\n${subpathResult.stdout}\n${subpathResult.stderr}`);
  console.log("site-kit pack, public publish dry-run, and fresh consumer import passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
