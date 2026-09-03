import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspace = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const temp = await mkdtemp(join(tmpdir(), "dds-solid-release-"));
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
const runNode = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`node ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

try {
  const packageNames = ["dds-tokens", "dds-css", "dds-icons", "dds-solid"];
  const tarballs = [];
  let solidTarball = "";
  for (const packageName of packageNames) {
    const packageRoot = join(workspace, "packages", packageName);
    const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    runPnpm(["pack", "--pack-destination", temp], packageRoot);
    const tarball = join(temp, `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`);
    tarballs.push(tarball);
    if (packageName === "dds-solid") solidTarball = tarball;
  }
  const packageRoot = join(workspace, "packages", "dds-solid");
  for (const bundle of ["dist/index.js", "dist/server.js"]) {
    const source = await readFile(join(packageRoot, bundle), "utf8");
    assert.match(source, /from\s+["']@devslab\/dds-icons["']/, `${bundle} must externalize dds-icons`);
  }
  publishDryRun(solidTarball, packageRoot);
  await writeFile(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }), "utf8");
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs, "solid-js@1.9.15", "jsdom@30.0.1"], temp);
  const installedRoot = join(temp, "node_modules", "@devslab", "dds-solid");
  const manifest = JSON.parse(await readFile(join(installedRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "@devslab/dds-solid");
  for (const path of ["dist/index.js", "dist/server.js", "dist/index.d.ts", "styles.css"]) {
    await access(join(installedRoot, path));
  }
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  const ssrScript = join(temp, "consumer-ssr.mjs");
  await writeFile(ssrScript, `
import { generateHydrationScript, renderToString } from "solid-js/web";
import { createComponent } from "solid-js";
import { Button, Icon } from "@devslab/dds-solid";
const html = renderToString(() => createComponent(Button, { get children() { return ["Fresh consumer ", createComponent(Icon, { name: "check", label: "Complete" })]; } }));
if (!html.includes("Fresh consumer") || !html.includes("aria-label=\\"Complete\\"")) throw new Error("fresh consumer SSR failed");
process.stdout.write(JSON.stringify({ bootstrap: generateHydrationScript(), html }));
`, "utf8");
  const ssrPayload = runNode([ssrScript], temp);
  await writeFile(join(temp, "ssr.json"), ssrPayload, "utf8");
  const hydrationScript = join(temp, "consumer-hydrate.mjs");
  await writeFile(hydrationScript, `
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
const { bootstrap, html } = JSON.parse(await readFile(new URL("./ssr.json", import.meta.url), "utf8"));
const dom = new JSDOM('<!doctype html><html><head>' + bootstrap + '</head><body><div id="root">' + html + '</div></body></html>', { runScripts: "dangerously" });
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator"]) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
Object.defineProperty(globalThis, "_$HY", { value: dom.window._$HY, configurable: true, writable: true });
const host = document.querySelector("#root");
const { hydrate } = await import("solid-js/web");
const { createComponent } = await import("solid-js");
const { Button, Icon } = await import("@devslab/dds-solid");
const diagnostics = [];
const warn = console.warn; const error = console.error;
console.warn = (...values) => diagnostics.push(values.join(" "));
console.error = (...values) => diagnostics.push(values.join(" "));
const dispose = hydrate(() => createComponent(Button, { get children() { return ["Fresh consumer ", createComponent(Icon, { name: "check", label: "Complete" })]; } }), host);
await Promise.resolve();
dispose(); console.warn = warn; console.error = error;
if (diagnostics.length) throw new Error('fresh consumer hydration diagnostics: ' + diagnostics.join("\\n"));
`, "utf8");
  runNode(["--conditions=browser", hydrationScript], temp);
  console.log("dds-solid pack, publish dry-run, and fresh consumer import, SSR, and hydration passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
