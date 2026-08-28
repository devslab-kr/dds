import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspace = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const temp = await mkdtemp(join(tmpdir(), "dds-solid-release-"));
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
  const packageNames = ["dds-tokens", "dds-css", "dds-icons", "dds-solid"];
  const tarballs = [];
  let solidTarball = "";
  let solidFiles = [];
  for (const packageName of packageNames) {
    const packageRoot = join(workspace, "packages", packageName);
    const [{ filename, files }] = JSON.parse(run(["pack", "--json", "--pack-destination", temp], packageRoot));
    const tarball = join(temp, filename);
    tarballs.push(tarball);
    if (packageName === "dds-solid") {
      solidTarball = tarball;
      solidFiles = files;
    }
  }
  const packageRoot = join(workspace, "packages", "dds-solid");
  const files = solidFiles;
  assert.ok(files.some(({ path }) => path === "dist/index.js"));
  assert.ok(files.some(({ path }) => path === "dist/index.d.ts"));
  assert.ok(files.some(({ path }) => path === "styles.css"));
  const published = JSON.parse(run(["publish", solidTarball, "--dry-run", "--json", "--ignore-scripts"], packageRoot));
  assert.equal(published.name, "@devslab/dds-solid");
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }), "utf8");
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], temp);
  const manifest = JSON.parse(await readFile(join(temp, "node_modules", "@devslab", "dds-solid", "package.json"), "utf8"));
  assert.equal(manifest.peerDependencies["solid-js"], "2.0.0-rc.3");
  console.log("dds-solid pack, restricted publish dry-run, and fresh consumer manifest passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
