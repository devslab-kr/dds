import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const workspace = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const temp = await mkdtemp(join(tmpdir(), "site-kit-release-"));
const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: join(temp, ".npm-cache") },
  });
  if (result.status !== 0) throw new Error(`${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

try {
  const packageNames = ["dds-tokens", "dds-css", "dds-icons", "dds-solid", "site-kit"];
  const tarballs = [];
  let siteKitTarball = "";
  let siteKitFiles = [];
  for (const packageName of packageNames) {
    const packageRoot = join(workspace, "packages", packageName);
    const [{ filename, files }] = JSON.parse(run(["pack", "--json", "--pack-destination", temp], packageRoot));
    const tarball = join(temp, filename);
    tarballs.push(tarball);
    if (packageName === "site-kit") {
      siteKitTarball = tarball;
      siteKitFiles = files;
    }
  }
  for (const path of ["dist/solid.js", "dist/solid.d.ts", "src/core/index.mjs", "src/core/index.d.ts", "src/tanstack-start.mjs", "styles.css"]) {
    assert.ok(siteKitFiles.some((file) => file.path === path), `${path} missing from package`);
  }
  const packageRoot = join(workspace, "packages", "site-kit");
  const published = JSON.parse(run(["publish", siteKitTarball, "--dry-run", "--json", "--ignore-scripts"], packageRoot));
  assert.equal(published.name, "@devslab/site-kit");
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }), "utf8");
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], temp);
  const installedRoot = join(temp, "node_modules", "@devslab", "site-kit");
  const manifest = JSON.parse(await readFile(join(installedRoot, "package.json"), "utf8"));
  assert.equal(manifest.publishConfig.access, "restricted");
  assert.equal(manifest.peerDependencies["solid-js"], "2.0.0-rc.3");
  const core = await import(pathToFileURL(join(installedRoot, "src", "core", "index.mjs")));
  assert.equal(core.LOCALES.length, 14);
  console.log("site-kit pack, restricted publish dry-run, and fresh consumer import passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
