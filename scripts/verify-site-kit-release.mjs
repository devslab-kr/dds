import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
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
  run(["publish", siteKitTarball, "--dry-run", "--json", "--ignore-scripts"], packageRoot);
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }), "utf8");
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], temp);
  const installedRoot = join(temp, "node_modules", "@devslab", "site-kit");
  const manifest = JSON.parse(await readFile(join(installedRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "@devslab/site-kit");
  for (const path of ["dist/solid.js", "dist/index.d.ts", "src/core/index.mjs", "src/core/index.d.mts", "src/tanstack-start.mjs", "src/tanstack-start.d.mts", "styles.css"]) {
    await access(join(installedRoot, path));
  }
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  const core = await import(pathToFileURL(join(installedRoot, "src", "core", "index.mjs")));
  assert.equal(core.LOCALES.length, 14);
  console.log("site-kit pack, public publish dry-run, and fresh consumer import passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
