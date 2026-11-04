import assert from "node:assert/strict";
import { readFile, access, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// A reusable, tracked fixture; no mkdtemp, scratch project or worktree is created.
const consumer = dirname(fileURLToPath(import.meta.url));
const root = resolve(consumer, "..");
const nodeModules = join(dirname(process.execPath), "node_modules");
function run(command, args, cwd = consumer) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
    );
  if (result.stdout.trim()) console.log(result.stdout.trim());
}
const npm = (args) =>
  run(
    process.platform === "win32" ? process.execPath : "npm",
    process.platform === "win32"
      ? [join(nodeModules, "npm/bin/npm-cli.js"), ...args]
      : args,
  );
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const tarball = join(
  consumer,
  `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`,
);
run(
  process.platform === "win32" ? process.execPath : "pnpm",
  process.platform === "win32"
    ? [
        join(nodeModules, "corepack/dist/pnpm.js"),
        "pack",
        "--pack-destination",
        consumer,
      ]
    : ["pack", "--pack-destination", consumer],
  root,
);
try {
  npm([
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--no-save",
    "--package-lock=false",
    tarball,
  ]);
  const installed = join(consumer, "node_modules/@devslab-kr/dds-auth");
  assert.ok(
    installed.startsWith(`${consumer}/`) ||
      installed.startsWith(`${consumer}\\`),
  );
  for (const file of [
    "dist/index.js",
    "dist/index.d.ts",
    "dist/react.js",
    "dist/react.d.ts",
    "styles.css",
    "LICENSE",
    "assets/google-g.png",
    "assets/kakao-symbol.svg",
    "assets/naver-symbol.png",
    "assets/provenance.json",
  ])
    await access(join(installed, file));
  const packed = JSON.parse(
    await readFile(join(installed, "package.json"), "utf8"),
  );
  assert.equal(packed.name, "@devslab-kr/dds-auth");
  assert.equal(packed.version, "0.1.0");
  assert.equal(
    packed.dependencies,
    undefined,
    "Headless package must not require a browser framework",
  );
  run(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--ignoreConfig",
    "--noEmit",
    "--jsx",
    "react-jsx",
    "--target",
    "ES2022",
    "--module",
    "ESNext",
    "--moduleResolution",
    "Bundler",
    "--skipLibCheck",
    "fixture.tsx",
  ]);
  run(process.execPath, ["runtime.mjs"]);
} finally {
  // This exact tarball is produced by this invocation; the permanent fixture and dependencies remain reusable.
  await rm(tarball, { force: true });
}
