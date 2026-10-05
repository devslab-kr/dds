import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
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

/**
 * D-033: the packed fonts.css must name only files the tarball carries, and a
 * fresh Vite app that imports it must end up serving every face from its own
 * dist/assets — never a data: URI (font-src 'self' blocks those), never a
 * node_modules path — with the `?url` preload pointing at the same file the
 * stylesheet uses. Vite is the workspace's; the app and its node_modules are
 * the fresh consumer's.
 */
async function verifyFamilyFonts(installedRoot, manifest) {
  assert.equal(manifest.exports["./fonts.css"], "./fonts.css");
  assert.equal(manifest.exports["./fonts/*"], "./fonts/*");
  const css = await readFile(join(installedRoot, "fonts.css"), "utf8");
  const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map(([, url]) => url);
  const fontsManifest = JSON.parse(await readFile(join(installedRoot, "fonts", "manifest.json"), "utf8"));
  const faces = fontsManifest.families.flatMap((family) => family.faces.map((face) => `./fonts/${family.dir}/${face.file}`));
  assert.deepEqual([...urls].sort(), [...faces].sort(), "the packed fonts.css references exactly the manifest's faces");
  for (const url of urls) await access(join(installedRoot, url));
  for (const family of fontsManifest.families) await access(join(installedRoot, "fonts", family.dir, "LICENSE.txt"));

  const app = join(temp, "font-app");
  await mkdir(join(app, "src"), { recursive: true });
  await writeFile(join(app, "index.html"), '<!doctype html><html lang="ko"><head><meta charset="utf-8"><script type="module" src="/src/main.js"></script></head><body><p>DevsLab 데브스랩 0123</p><code>mono</code></body></html>\n', "utf8");
  await writeFile(
    join(app, "src", "main.js"),
    'import "./app.css";\nimport geistLatin from "@devslab/site-kit/fonts/geist/geist-latin-wght-normal.woff2?url";\ndocument.documentElement.dataset.preload = geistLatin;\n',
    "utf8",
  );
  // The README's path: the product's own stylesheet @imports the kit's, so
  // each url() has to be rebased onto node_modules, not onto the product CSS.
  await writeFile(join(app, "src", "app.css"), '@import "@devslab/site-kit/fonts.css";\nhtml { font-family: var(--dds-font-family-sans, sans-serif); }\n', "utf8");
  const vitePath = createRequire(join(workspace, "package.json")).resolve("vite");
  const { build } = await import(pathToFileURL(vitePath));
  await build({ root: app, configFile: false, logLevel: "warn", build: { outDir: join(app, "dist"), emptyOutDir: true } });
  const assets = await readdir(join(app, "dist", "assets"));
  const woff2 = assets.filter((name) => name.endsWith(".woff2"));
  assert.equal(woff2.length, faces.length, `every face lands in dist/assets (${woff2.length} of ${faces.length})`);
  const builtCss = (await Promise.all(assets.filter((name) => name.endsWith(".css")).map((name) => readFile(join(app, "dist", "assets", name), "utf8")))).join("\n");
  const builtUrls = [...builtCss.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(([, url]) => url);
  assert.equal(builtUrls.length, faces.length, "the built stylesheet keeps one url() per face");
  for (const url of builtUrls) {
    assert.match(url, /^\/assets\/[\w.-]+\.woff2$/, `${url}: rewritten to the app's own /assets, not inlined or left on node_modules`);
    assert.ok(woff2.includes(url.slice("/assets/".length)), `${url} exists in dist/assets`);
  }
  assert.doesNotMatch(builtCss, /data:font|data:application\/font|node_modules/, "no inlined face, no node_modules path");
  for (const family of ["Geist", "Geist Mono", "Pretendard"]) assert.match(builtCss, new RegExp(`font-family:\\s*"?${family}"?[;}]`), `${family} survives the build`);
  const js = (await Promise.all(assets.filter((name) => name.endsWith(".js")).map((name) => readFile(join(app, "dist", "assets", name), "utf8")))).join("\n");
  const preload = js.match(/["'`](\/assets\/geist-latin-wght-normal[^"'`]*\.woff2)["'`]/)?.[1];
  assert.ok(preload, `the ?url import yields an /assets URL\n${js.slice(0, 800)}`);
  assert.ok(builtUrls.includes(preload), "the preload URL is the very file the stylesheet uses");
  // The README's no-bundler path: copy fonts.css + fonts/ side by side; the
  // relative url()s must then resolve inside the copy.
  const copyScript = join(temp, "copy-fonts.mjs");
  await writeFile(
    copyScript,
    'import { cpSync } from "node:fs";\nimport { dirname, join } from "node:path";\nimport { createRequire } from "node:module";\n\nconst kit = dirname(createRequire(import.meta.url).resolve("@devslab/site-kit/fonts.css"));\ncpSync(join(kit, "fonts.css"), "public/site-kit/fonts.css");\ncpSync(join(kit, "fonts"), "public/site-kit/fonts", { recursive: true });\n',
    "utf8",
  );
  const copied = spawnSync(process.execPath, [copyScript], { cwd: temp, encoding: "utf8" });
  if (copied.status !== 0) throw new Error(`the README copy script failed\n${copied.stdout}\n${copied.stderr}`);
  for (const url of urls) await access(join(temp, "public", "site-kit", url));
  const sizes = await Promise.all(woff2.map(async (name) => (await stat(join(app, "dist", "assets", name))).size));
  console.log(`fresh Vite consumer: ${woff2.length} faces in dist/assets (${Math.round(sizes.reduce((a, b) => a + b, 0) / 1024)} KB), preload ${preload}`);
}

try {
  const packageNames =["dds-tokens", "dds-css", "dds-icons", "dds-solid", "site-kit"];
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
    "src/core/publisher.mjs", "src/core/publisher.d.mts", "src/core/devslab.mjs", "src/core/devslab.d.mts",
    "src/core/flags.mjs", "src/core/flags.d.mts",
    "src/core/gtm.mjs", "src/core/gtm.d.mts", "src/core/consent.mjs", "src/core/consent.d.mts",
    "src/tanstack-start.mjs", "src/tanstack-start.d.mts",
    "styles.css", "site-sections.css", "flags/LICENSE-flag-icons.txt",
    "src/core/fonts.mjs", "src/core/fonts.d.mts", "fonts.css", "fonts/manifest.json",
  ]) {
    await access(join(installedRoot, path));
  }
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  const core = await import(pathToFileURL(join(installedRoot, "src", "core", "index.mjs")));
  assert.equal(core.LOCALES.length, 14);
  assert.match(core.gtmHeadScript("GTM-ABC123"), /'GTM-ABC123'\);$/, "the packed core must export the Tag Manager loader");
  assert.doesNotMatch(core.consentHeadScript({ granted: false, gtm: "GTM-ABC123" }), /googletagmanager/, "the packed core gates Tag Manager behind consent (D-034)");
  assert.equal(typeof core.createConsentManager, "function", "the packed core must export the consent manager");
  const { DEVSLAB_PUBLISHER } = await import(pathToFileURL(join(installedRoot, "src/core/devslab.mjs")));
  assert.equal(core.buildPublisher(DEVSLAB_PUBLISHER).link.label, "데브스랩(DevsLab)");
  assert.equal(manifest.exports["./devslab"].types, "./src/core/devslab.d.mts");
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
  await verifyFamilyFonts(installedRoot, manifest);
  console.log("site-kit pack, public publish dry-run, fresh consumer import and font build passed");
} finally {
  await rm(temp, { recursive: true, force: true });
}
