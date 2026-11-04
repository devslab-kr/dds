import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const workspace = resolve(packageRoot, "../..");
const consumer = join(packageRoot, "consumer");
const artifacts = join(consumer, "node_modules/.dds-email-template-artifacts");
const evidenceDirectory = join(workspace, "test-results/dds-email-template");
const manifest = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
);
const args = process.argv.slice(2);
assert.ok(
  args.every(
    (arg) =>
      arg === "--keep-tarball" ||
      arg === "--registry" ||
      arg.startsWith("--registry="),
  ),
  "Usage: node scripts/verify-package.mjs [--keep-tarball] [--registry[=https://registry.example]]",
);
const registryArgument = args.find(
  (arg) => arg === "--registry" || arg.startsWith("--registry="),
);
const registry = registryArgument
  ? new URL(
      registryArgument.includes("=")
        ? registryArgument.slice("--registry=".length)
        : manifest.publishConfig.registry,
    )
  : undefined;
if (registry) {
  assert.equal(registry.protocol, "https:", "Registry must use HTTPS");
  assert.ok(
    !registry.username &&
      !registry.password &&
      !registry.search &&
      !registry.hash,
    "Registry URL must not contain credentials, a query, or a fragment",
  );
}
const mode = registry ? "registry" : "local";
const evidencePath = join(evidenceDirectory, `${mode}-consumer.json`);
const rootRequire = createRequire(join(workspace, "package.json"));
const siteKitRequire = createRequire(
  join(workspace, "packages/site-kit/package.json"),
);
const wranglerRequire = createRequire(
  siteKitRequire.resolve("wrangler/package.json"),
);
const miniflareManifestPath = wranglerRequire.resolve("miniflare/package.json");
const miniflareRequire = createRequire(miniflareManifestPath);
const npmCli = join(
  dirname(process.execPath),
  "node_modules/npm/bin/npm-cli.js",
);
await access(npmCli);
await mkdir(artifacts, { recursive: true });
await mkdir(evidenceDirectory, { recursive: true });

function run(command, commandArgs, cwd = consumer) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${basename(command)} ${commandArgs.join(" ")} failed\n${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}
const npm = (commandArgs, cwd) =>
  run(process.execPath, [npmCli, ...commandArgs], cwd);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const evidence = {
  checkedAt: new Date().toISOString(),
  mode,
  package: `${manifest.name}@${manifest.version}`,
  gitHead: run("git", ["rev-parse", "HEAD"], workspace),
  worktreeDirty: run("git", ["status", "--porcelain"], workspace) !== "",
  node: process.version,
  typescript: (await readJson(rootRequire.resolve("typescript/package.json")))
    .version,
  miniflare: (await readJson(miniflareManifestPath)).version,
  workerd: (await readJson(miniflareRequire.resolve("workerd/package.json")))
    .version,
  checks: [],
  status: "running",
};
let tarball;
let stage = "build";
try {
  assert.equal(manifest.name, "@devslab-kr/dds-email-template");
  run(process.execPath, ["build.mjs"], packageRoot);
  evidence.checks.push("package build");
  stage = "pack";
  const packed = JSON.parse(
    npm(
      ["pack", "--json", "--ignore-scripts", "--pack-destination", artifacts],
      packageRoot,
    ),
  );
  assert.equal(packed.length, 1, "Expected one local package tarball");
  assert.equal(packed[0].filename, basename(packed[0].filename));
  tarball = resolve(artifacts, packed[0].filename);
  assert.ok(tarball.startsWith(`${resolve(artifacts)}${sep}`));
  const bytes = await readFile(tarball);
  const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  evidence.tarball = tarball;
  evidence.integrity = integrity;
  evidence.sha512 = createHash("sha512").update(bytes).digest("hex");
  assert.equal(integrity, packed[0].integrity);
  evidence.checks.push("local packed tarball SHA512");

  let installTarget = tarball;
  if (registry) {
    stage = "registry metadata";
    const dist = JSON.parse(
      npm([
        "view",
        `${manifest.name}@${manifest.version}`,
        "dist",
        "--json",
        `--registry=${registry.href}`,
        "--prefer-online",
      ]),
    );
    assert.equal(
      dist.integrity,
      integrity,
      "Registry integrity differs from the local release tarball",
    );
    const remoteTarball = new URL(dist.tarball);
    assert.ok(
      !remoteTarball.username &&
        !remoteTarball.password &&
        !remoteTarball.search &&
        !remoteTarball.hash,
      "Registry tarball URL contains credentials or transient query data",
    );
    evidence.registry = registry.href;
    evidence.registryIntegrity = dist.integrity;
    evidence.registryTarball = remoteTarball.href;
    evidence.checks.push("registry metadata matches local tarball integrity");
    installTarget = `${manifest.name}@${manifest.version}`;
  }

  stage = "fixed consumer install";
  const installed = join(
    consumer,
    "node_modules/@devslab-kr/dds-email-template",
  );
  if (registry) {
    // Remove only the checked package from prior local verification, so its
    // same-version local installation cannot satisfy the registry install.
    const existing = await lstat(installed).catch((error) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (existing) {
      assert.ok(existing.isDirectory() && !existing.isSymbolicLink());
      const actual = await realpath(installed);
      const boundary = await realpath(join(consumer, "node_modules"));
      assert.ok(actual.startsWith(`${boundary}${sep}`));
      const previous = await readJson(join(actual, "package.json"));
      assert.equal(previous.name, manifest.name);
      assert.equal(previous.version, manifest.version);
      await rm(actual, { recursive: true });
    }
    evidence.checks.push("prior local package removed before registry install");
  }
  npm([
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--no-save",
    "--package-lock=false",
    "--prefer-online",
    `--cache=${join(artifacts, registry ? "registry-npm-cache" : "npm-cache")}`,
    ...(registry ? [`--registry=${registry.href}`] : []),
    installTarget,
  ]);
  const installedManifest = await readJson(join(installed, "package.json"));
  assert.equal(installedManifest.name, manifest.name);
  assert.equal(installedManifest.version, manifest.version);
  assert.equal(
    Object.keys(installedManifest.dependencies ?? {}).length,
    0,
    "Package must have zero runtime dependencies",
  );
  assert.equal(
    Object.keys(installedManifest.peerDependencies ?? {}).length,
    0,
    "Package must have zero peer dependencies",
  );
  await Promise.all(
    ["dist/index.mjs", "dist/index.d.mts", "LICENSE"].map((file) =>
      access(join(installed, file)),
    ),
  );
  assert.equal(
    await readFile(join(installed, "dist/index.mjs"), "utf8"),
    await readFile(join(packageRoot, "dist/index.mjs"), "utf8"),
  );
  assert.equal(
    await readFile(join(installed, "dist/index.d.mts"), "utf8"),
    await readFile(join(packageRoot, "dist/index.d.mts"), "utf8"),
  );
  evidence.checks.push(
    registry
      ? "fixed-version registry consumer install"
      : "local tarball consumer install",
  );

  stage = "Node ESM import";
  const nodeResult = JSON.parse(run(process.execPath, ["runtime.mjs"]));
  evidence.checks.push("Node ESM import, render, and validation error");
  stage = "TypeScript executable";
  const typescriptManifestPath = rootRequire.resolve("typescript/package.json");
  const typescriptManifest = await readJson(typescriptManifestPath);
  const tsc = resolve(
    dirname(typescriptManifestPath),
    typescriptManifest.bin.tsc,
  );
  for (const configuration of ["node", "dom"]) {
    stage = `${configuration} consumer types`;
    run(process.execPath, [tsc, "-p", `tsconfig.${configuration}.json`]);
    evidence.checks.push(
      configuration === "node"
        ? "NodeNext ESM types without DOM"
        : "DOM Bundler types without Node ambient declarations",
    );
  }

  stage = "workerd consumer";
  const { Miniflare, convertV4MiniflareOptions, Log, LogLevel } = await import(
    pathToFileURL(wranglerRequire.resolve("miniflare")).href
  );
  const modules = await Promise.all(
    ["worker.mjs", "contract.mjs", "input.mjs"].map(async (file) => ({
      type: "ESModule",
      path: join(consumer, file),
      contents: await readFile(join(consumer, file), "utf8"),
    })),
  );
  modules.push({
    type: "ESModule",
    path: join(consumer, "packed/index.mjs"),
    contents: await readFile(join(installed, "dist/index.mjs"), "utf8"),
  });
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      compatibilityDate: "2026-08-28",
      modulesRoot: consumer,
      modules,
      cf: false,
      telemetry: { enabled: false },
      log: new Log(LogLevel.ERROR),
      resourceTmpPath: join(artifacts, "workerd"),
    }),
  );
  try {
    const response = await runtime.dispatchFetch(
      "https://example.invalid/packed-consumer",
    );
    assert.equal(response.status, 200);
    assert.deepEqual(
      await response.json(),
      nodeResult,
      "Node and real workerd rendering or validation error differ",
    );
  } finally {
    await runtime.dispose();
  }
  evidence.checks.push(
    "real workerd rendering and validation equality with Node, without nodejs_compat or DOM mocks",
  );
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.failedStage = stage;
  throw error;
} finally {
  evidence.finishedAt = new Date().toISOString();
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  if (tarball && !args.includes("--keep-tarball")) {
    // Only this invocation's exact package tarball is removed; fixture and dependencies remain reusable.
    assert.equal(dirname(tarball), resolve(artifacts));
    await rm(tarball, { force: true });
  }
}
console.log(
  `Verified ${evidence.package}: packed Node import, Node/DOM types, and real workerd`,
);
console.log(`SHA512 ${evidence.sha512}`);
console.log(`Evidence ${evidencePath}`);
if (args.includes("--keep-tarball")) console.log(`Tarball ${tarball}`);
