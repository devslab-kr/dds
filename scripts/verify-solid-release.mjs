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
const runNode = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`node ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
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
  run(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs, "solid-js@2.0.0-rc.3", "@solidjs/web@2.0.0-rc.3", "jsdom@30.0.1"], temp);
  const manifest = JSON.parse(await readFile(join(temp, "node_modules", "@devslab", "dds-solid", "package.json"), "utf8"));
  assert.equal(manifest.peerDependencies["solid-js"], "2.0.0-rc.3");
  const ssrScript = join(temp, "consumer-ssr.mjs");
  await writeFile(ssrScript, `
import { renderToString } from "@solidjs/web";
import { createComponent } from "solid-js";
import { Button, Icon } from "@devslab/dds-solid";
const html = renderToString(() => createComponent(Button, { get children() { return ["Fresh consumer ", createComponent(Icon, { name: "check", label: "Complete" })]; } }));
if (!html.includes("Fresh consumer") || !html.includes("aria-label=\\"Complete\\"")) throw new Error("fresh consumer SSR failed");
process.stdout.write(html);
`, "utf8");
  const ssrHtml = runNode([ssrScript], temp);
  await writeFile(join(temp, "ssr.html"), ssrHtml, "utf8");
  const hydrationScript = join(temp, "consumer-hydrate.mjs");
  await writeFile(hydrationScript, `
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
const dom = new JSDOM('<div id="root"></div>');
for (const key of ["window", "document", "Node", "HTMLElement", "SVGElement", "MutationObserver", "navigator"]) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
const host = document.querySelector("#root");
host.innerHTML = await readFile(new URL("./ssr.html", import.meta.url), "utf8");
const { hydrate } = await import("@solidjs/web");
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
