import assert from "node:assert/strict";
import { readFile, access, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const consumer = dirname(fileURLToPath(import.meta.url));
const packages = resolve(consumer, "../..");
const packDirectory = join(consumer, ".verify-tarballs");
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
const pnpmPrefix =
  process.platform === "win32"
    ? [join(nodeModules, "corepack/dist/pnpm.js")]
    : [];

// Acquire the tracked fixture exclusively before touching its shared node_modules.
await mkdir(packDirectory);
try {
  const candidates = [];
  for (const directory of [
    "dds-tokens",
    "dds-css",
    "dds-icons",
    "dds-react",
    "dds-auth",
  ]) {
    const packageRoot = join(packages, directory);
    const { name, version } = JSON.parse(
      await readFile(join(packageRoot, "package.json"), "utf8"),
    );
    run(
      process.platform === "win32" ? process.execPath : "pnpm",
      [...pnpmPrefix, "pack", "--pack-destination", packDirectory],
      packageRoot,
    );
    const filename = `${name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`;
    candidates.push({ name, version, tarball: join(packDirectory, filename) });
  }
  npm([
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--no-save",
    "--package-lock=false",
    ...candidates.map(({ tarball }) => tarball),
  ]);
  for (const { name, version } of candidates) {
    const path = join(consumer, "node_modules", name, "package.json");
    const packed = JSON.parse(await readFile(path, "utf8"));
    assert.equal(packed.name, name);
    assert.equal(
      packed.version,
      version,
      `Expected the packed candidate for ${name}`,
    );
  }
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
    "assets/naver-official-symbol.png",
    "assets/discord-symbol.png",
    "assets/github-symbol.svg",
    "assets/github-octicons-MIT.txt",
    "assets/figma-symbol.png",
    "assets/line-symbol.png",
    "assets/linkedin-symbol.png",
    "assets/microsoft-symbol.svg",
    "assets/notion-symbol.png",
    "assets/slack-symbol.svg",
    "assets/x-symbol.png",
    "assets/x-symbol-light.png",
    "assets/zoom-symbol.png",
    "assets/provenance.json",
  ])
    await access(join(installed, file));
  const packed = JSON.parse(
    await readFile(join(installed, "package.json"), "utf8"),
  );
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
  await rm(packDirectory, { recursive: true, force: true });
}
