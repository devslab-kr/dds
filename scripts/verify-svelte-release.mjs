import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const workspace = fileURLToPath(new URL("..", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "dds-svelte-release-"));
const npm = process.platform === "win32" ? process.execPath : "npm";
const prefix =
  process.platform === "win32"
    ? [join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")]
    : [];
const pnpmPath = process.env.npm_execpath;
assert.ok(pnpmPath, "Run via pnpm run verify:svelte:release");
const pnpmIsScript = /\.[cm]?js$/.test(pnpmPath),
  pnpm = pnpmIsScript ? process.execPath : pnpmPath,
  pnpmPrefix = pnpmIsScript ? [pnpmPath] : [];
function run(command, args, cwd) {
  const env = {
    ...process.env,
    NPM_CONFIG_REGISTRY: "https://registry.npmjs.org",
  };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}
try {
  for (const script of [
    "packages/dds-tokens/build.mjs",
    "packages/dds-css/build.mjs",
  ])
    run(process.execPath, [join(workspace, script)], workspace);
  const tarballs = [];
  for (const name of ["dds-tokens", "dds-css", "dds-svelte"]) {
    run(
      pnpm,
      [...pnpmPrefix, "pack", "--pack-destination", temp],
      join(workspace, "packages", name),
    );
    const manifest = JSON.parse(
      await readFile(join(workspace, "packages", name, "package.json"), "utf8"),
    );
    tarballs.push(join(temp, `devslab-${name}-${manifest.version}.tgz`));
  }
  const tarball = tarballs.at(-1);
  try {
    run(
      npm,
      [
        ...prefix,
        "publish",
        tarball,
        "--dry-run",
        "--ignore-scripts",
        "--provenance=false",
        "--json",
      ],
      workspace,
    );
  } catch (error) {
    // Source PRs can share the latest published version. As in the Vue gate,
    // only this registry collision is expected; the exact packed files and
    // isolated SSR/client consumer below must still pass.
    if (!/cannot publish over the previously published versions/i.test(String(error)))
      throw error;
    console.log("Published version already exists; publish dry-run collision only.");
  }
  const [report] = JSON.parse(
    run(
      npm,
      [...prefix, "pack", tarball, "--dry-run", "--ignore-scripts", "--json"],
      temp,
    ),
  );
  const files = report.files.map((file) => file.path);
  for (const file of [
    "LICENSE",
    "dist/index.js",
    "dist/index.d.ts",
    "dist/Layout.svelte",
    "dist/Layout.svelte.d.ts",
    "dist/LeftNav.svelte",
    "dist/TopNav.svelte",
    "dist/ConsoleShell.svelte",
    "styles.css",
  ])
    assert.ok(files.includes(file), `${file} missing from tarball`);
  assert.ok(
    !files.some(
      (file) => file.startsWith(".svelte-kit/") || file.startsWith("tests/"),
    ),
  );
  const manifest = JSON.parse(
    await readFile(join(workspace, "packages/dds-svelte/package.json"), "utf8"),
  );
  assert.ok(
    !Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    }).some((name) => /react|solid|vue/.test(name)),
    "No other UI runtime",
  );
  await writeFile(
    join(temp, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    npm,
    [
      ...prefix,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      ...tarballs,
      "svelte@5.57.2",
      "vite@8.2.1",
      "@sveltejs/vite-plugin-svelte@7.3.1",
      "jsdom@30.0.1",
    ],
    temp,
  );
  await writeFile(
    join(temp, "server.mjs"),
    `import{render}from'svelte/server';import{ConsoleShell,Layout,LeftNav,TopNav}from'@devslab/dds-svelte';const props={surface:'test',activePath:'/products',labels:{skip:'Skip',menuOpen:'Open',menuClose:'Close',nav:'Navigation',badge:'{count}'},brand:{href:'/',name:'DDS',mark:'/mark.svg'},header:{title:'Title'},nav:[{label:'Work',items:[{id:'p',href:'/products',label:'Products'}]}]};export const html=render(ConsoleShell,{props}).body;export const exports=[Layout,LeftNav,TopNav];`,
  );
  await writeFile(
    join(temp, "client.mjs"),
    `import{mount,tick}from'svelte';import{ConsoleShell}from'@devslab/dds-svelte';mount(ConsoleShell,{target:document.body,props:{surface:'test',activePath:'/products',labels:{skip:'Skip',menuOpen:'Open',menuClose:'Close',nav:'Navigation',badge:'{count}'},brand:{href:'/',name:'DDS',mark:'/mark.svg'},header:{title:'Title'},nav:[]}});await tick();`,
  );
  await writeFile(
    join(temp, "verify.mjs"),
    `import assert from'node:assert/strict';import{createServer,build}from'vite';import{svelte}from'@sveltejs/vite-plugin-svelte';import{JSDOM}from'jsdom';const server=await createServer({configFile:false,plugins:[svelte({configFile:false})],server:{middlewareMode:true},ssr:{noExternal:['@devslab/dds-svelte']}});try{const result=await server.ssrLoadModule('./server.mjs');assert.ok(result.html.includes('dds-layout'));assert.equal(result.exports.length,3);}finally{await server.close()}await build({configFile:false,plugins:[svelte({configFile:false})],build:{target:'esnext',lib:{entry:'client.mjs',formats:['es'],fileName:()=> 'client.js'},emptyOutDir:true}});const dom=new JSDOM('<!doctype html><html><body></body></html>',{pretendToBeVisual:true,url:'http://localhost'});for(const key of ['window','document','navigator','Node','Text','Comment','Element','HTMLElement','Document','Event','MouseEvent','CustomEvent','MutationObserver'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);await import('./dist/client.js');assert.ok(document.querySelector('.dds-layout'));const toggle=document.querySelector('[data-action="toggle-rail"]');toggle.click();await new Promise(resolve=>setTimeout(resolve,30));assert.equal(toggle.getAttribute('aria-expanded'),'true');dom.window.close();console.log('fresh Svelte tarball SSR and client mount passed');`,
  );
  run(process.execPath, ["verify.mjs"], temp);
  const css = await readFile(
    join(temp, "node_modules/@devslab/dds-css/dist/dds.css"),
    "utf8",
  );
  assert.ok(css.includes(".dds-layout") && css.includes(".dds-top-nav"));
  console.log(
    "DDS Svelte release verified: packed exports/types/styles/license, publish dry-run, isolated consumer SSR and client mount.",
  );
} finally {
  assert.equal(dirname(temp), resolve(tmpdir()));
  assert.ok(basename(temp).startsWith("dds-svelte-release-"));
  await rm(temp, { recursive: true, force: true });
}
