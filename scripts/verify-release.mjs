import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspace = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const npm = process.platform === "win32" ? process.execPath : "npm";
const npmPrefix = process.platform === "win32"
  ? [join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")]
  : [];
const packageDirs = ["dds-tokens", "dds-css", "dds-icons"];
const temp = await mkdtemp(join(tmpdir(), "dds-release-"));

function run(command, args, cwd) {
  const env = {
    ...process.env,
    NPM_CONFIG_CACHE: join(temp, ".npm-cache"),
    NPM_CONFIG_OFFLINE: "true",
  };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_CONFIG_USERCONFIG;
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

try {
  for (const script of [
    "packages/dds-tokens/build.mjs",
    "packages/dds-tokens/scripts/validate-tokens.mjs",
    "packages/dds-css/build.mjs",
    "packages/dds-css/scripts/check-css.mjs",
    "packages/dds-icons/build.mjs",
    "packages/dds-icons/scripts/check-icons.mjs",
  ]) run(process.execPath, [join(workspace, script)], workspace);

  const tarballs = [];
  for (const directory of packageDirs) {
    const cwd = join(workspace, "packages", directory);
    const output = run(npm, [...npmPrefix, "pack", "--json", "--pack-destination", temp], cwd);
    const [{ filename, files }] = JSON.parse(output);
    assert.ok(files.some(({ path }) => path === "package.json"));
    assert.ok(files.some(({ path }) => path.startsWith("dist/")), `${directory} must pack dist`);
    if (directory === "dds-icons") {
      assert.ok(files.some(({ path }) => path === "direction-policy.json"));
    }
    const tarball = join(temp, basename(filename));
    tarballs.push(tarball);
    const dryRun = JSON.parse(run(npm, [...npmPrefix, "publish", tarball, "--dry-run", "--json", "--ignore-scripts"], cwd));
    assert.equal(dryRun.name, `@devslab/${directory}`);
  }

  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true }), "utf8");
  run(npm, [...npmPrefix, "install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], temp);

  const tokens = await import(new URL(`file:///${join(temp, "node_modules", "@devslab", "dds-tokens", "dist", "tokens.js").replaceAll("\\", "/")}`));
  const icons = await import(new URL(`file:///${join(temp, "node_modules", "@devslab", "dds-icons", "dist", "icons.js").replaceAll("\\", "/")}`));
  const css = await readFile(join(temp, "node_modules", "@devslab", "dds-css", "dist", "dds.css"), "utf8");
  const directionPolicy = JSON.parse(await readFile(
    join(temp, "node_modules", "@devslab", "dds-icons", "direction-policy.json"),
    "utf8",
  ));
  assert.ok(Object.keys(tokens).length > 0, "fresh consumer can import tokens");
  assert.ok(Object.keys(icons).length > 0, "fresh consumer can import icons");
  assert.match(css, /\.dds-btn/);
  assert.ok(directionPolicy.mirrorInRtl.includes("arrow-left"));
  console.log("pack, publish dry-run, and fresh consumer verification passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
