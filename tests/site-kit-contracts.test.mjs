import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("site-kit exposes runtime-neutral, Solid, TanStack, and stylesheet boundaries", async () => {
  const manifest = await json("packages/site-kit/package.json");
  assert.equal(manifest.name, "@devslab/site-kit");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.publishConfig.access, "public");
  for (const path of [".", "./devslab", "./solid", "./tanstack-start", "./styles.css"]) assert.ok(manifest.exports[path]);
  assert.equal(manifest.exports["./devslab"].types, "./src/core/devslab.d.mts");
  assert.equal(manifest.exports["./devslab"].import, "./src/core/devslab.mjs");
  assert.ok(manifest.files.includes("src/core"));
  assert.equal(manifest.exports["./solid"].types, "./dist/index.d.ts");
  assert.equal(manifest.exports["./solid"].browser, "./dist/solid.js");
  assert.equal(manifest.exports["./solid"].worker, "./dist/solid.server.js");
  assert.equal(manifest.exports["./solid"].workerd, "./dist/solid.server.js");
  assert.equal(manifest.exports["./solid"].node, "./dist/solid.server.js");
  assert.ok(
    Object.keys(manifest.exports["./solid"]).indexOf("worker") < Object.keys(manifest.exports["./solid"]).indexOf("browser"),
    "Worker SSR must win when worker and browser conditions are both active",
  );
  assert.match(manifest.scripts.build, /vite build --config vite\.server\.config\.ts/);
  assert.match(await read("packages/site-kit/vite.server.config.ts"), /solid\.server\.js/);
  assert.match(await read("packages/site-kit/vitest.config.ts"), /@devslab\/dds-solid/);
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  assert.equal(manifest.peerDependencies["@solidjs/web"], undefined);
  assert.equal(manifest.devDependencies["@types/node"], "26.3.0");
  assert.equal(manifest.devDependencies.typescript, "7.0.2");
});

test("Solid adapter exports every shared public-site shell", async () => {
  const source = await read("packages/site-kit/src/solid/index.ts");
  for (const symbol of [
    "SiteHeader", "LocaleMenu", "LocaleMenuVariant", "ThemeToggle", "MarketingShell", "SiteFooter",
    "LegalLayout", "StatusBanner", "RequestAccessForm", "NotFoundLayout", "ErrorLayout",
    "OssProductMark", "OssProductMarkProps",
    "SectionBlock", "SectionHead", "HeroSplit", "StepFlow", "FeatureRows", "PricingNote",
  ]) assert.match(source, new RegExp(`\\b${symbol}\\b`), `${symbol} missing`);
});

test("section primitives ship their stylesheet through styles.css and keep two glyph systems", async () => {
  const [styles, sections, tsx] = await Promise.all([
    read("packages/site-kit/styles.css"),
    read("packages/site-kit/site-sections.css"),
    read("packages/site-kit/src/solid/sections.tsx"),
  ]);
  assert.match(styles, /@import "\.\/site-sections\.css";/);
  assert.match(sections, /\.site-section__index\s*\{[^}]*--dds-font-family-mono/);
  assert.match(sections, /\.site-steps__marker\s*\{[^}]*border-radius: var\(--dds-radius-full\)/);
  assert.doesNotMatch(sections, /#[0-9a-f]{3,8}\b/i, "colour literals belong to product brand slices");
  assert.doesNotMatch(tsx, /`0\$\{index\(\) \+ 1\}`/, "steps never render the section's zero-padded index");
  assert.doesNotMatch(tsx, /style=/, "no inline styles in primitives");
});

test("flag locale menu is a native disclosure with tokenised, logical styles", async () => {
  const menu = await read("packages/site-kit/src/solid/locale-menu.tsx");
  const styles = await read("packages/site-kit/styles.css");
  assert.match(menu, /<details/);
  assert.match(menu, /<summary/);
  assert.match(menu, /aria-current=/);
  assert.match(menu, /hreflang=/);
  assert.doesNotMatch(menu, /props\.messages\.[A-Za-z0-9_]+\s*\?\?/);
  assert.match(styles, /\.site-locale-flag__trigger/);
  assert.match(styles, /\.site-locale-flag__option/);
  assert.match(styles, /min-inline-size:\s*44px/);
  assert.match(styles, /min-block-size:\s*44px/);
  assert.doesNotMatch(styles, /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/, "site-kit styles must stay on tokens");
  const core = await read("packages/site-kit/src/core/index.mjs");
  assert.doesNotMatch(core, /flagFor/);
  const manifest = await json("packages/site-kit/package.json");
  assert.ok(manifest.exports["./flags"], "flag data must ship on its own subpath, not the root barrel");
  assert.equal(manifest.exports["./flags"].types, "./src/core/flags.d.mts");
  assert.equal(manifest.exports["./flags"].import, "./src/core/flags.mjs");
  assert.match(await read("packages/site-kit/package.json"), /build-flags\.mjs --check/);
});

test("flag artwork stays out of the browser bundle: server writes the sprite, the client <use>s it", async () => {
  // The bodies are ~115 KB. They used to ride along with every SiteHeader
  // because the menu imported them statically and re-set innerHTML on the
  // client, hydration included. Now the menu imports only the locale→country
  // map; the bodies reach the server build through an aliased loader and the
  // browser build through a dynamic import taken only without server HTML.
  const menu = await read("packages/site-kit/src/solid/locale-menu.tsx");
  assert.match(menu, /from "\.\.\/core\/flag-countries\.mjs"/);
  assert.doesNotMatch(menu, /flag-bodies\.mjs|core\/flags\.mjs|FLAGS_BY_COUNTRY|LOCALE_FLAGS|flagFor\b/, "the menu must not reach the bodies statically");
  assert.match(menu, /<symbol id=/);
  assert.match(menu, /<use href=/);
  // Adoption is decided by the element, not the hydration context: a drifted
  // hydration recreates the sprite empty while the context is still set, and
  // trusting the context left the first consumer with a blank flag box (D-027).
  assert.match(menu, /childElementCount > 0\) return;/, "a sprite the server drew is adopted, not reloaded");
  assert.doesNotMatch(menu, /sharedConfig\.context/, "the hydration context is not what decides whether the sprite loads");
  const loader = await read("packages/site-kit/src/solid/flag-bodies.ts");
  assert.match(loader, /import\("\.\.\/core\/flag-bodies\.mjs"\)/, "the browser loader is a dynamic import");
  assert.doesNotMatch(loader, /^import \{[^}]*FLAGS_BY_COUNTRY/m);
  const server = await read("packages/site-kit/src/solid/flag-bodies.server.ts");
  assert.match(server, /^import \{ FLAGS_BY_COUNTRY \} from "\.\.\/core\/flag-bodies\.mjs"/m);
  for (const config of ["packages/site-kit/vite.server.config.ts", "packages/site-kit/vitest.ssr.config.ts"]) {
    assert.match(await read(config), /"\.\/flag-bodies":.*flag-bodies\.server\.ts/, `${config} must alias the loader to the server one`);
  }
  assert.doesNotMatch(await read("packages/site-kit/vite.config.ts"), /flag-bodies\.server/, "the browser build must not get the server loader");
  const styles = await read("packages/site-kit/styles.css");
  assert.match(styles, /\.site-flag-sprite\s*\{[^}]*inline-size:\s*0/);
  assert.doesNotMatch(styles, /\.site-flag-sprite\s*\{[^}]*display:\s*none/, "a display:none sprite breaks referenced clip paths and gradients");
  const manifest = await json("packages/site-kit/package.json");
  assert.match(manifest.scripts.check, /check-client-bundle\.mjs/, "the bundle gate runs in check");
  assert.match(manifest.scripts.check, /build-flags\.mjs --check.*check-client-bundle/, "flags in sync before the gate reads them");
  const generator = await read("packages/site-kit/scripts/build-flags.mjs");
  for (const file of ["flag-countries.mjs", "flag-bodies.mjs", "flags.mjs"]) assert.match(generator, new RegExp(`src/core/${file}`));
});

test("OSS product marks remain caller-supplied and reference the canonical brand source", async () => {
  const component = await read("packages/site-kit/src/solid/oss-product-mark.tsx");
  const styles = await read("packages/site-kit/styles.css");
  assert.match(component, /src:\s*string/);
  assert.match(component, /name:\s*string/);
  assert.match(component, /decoding="async"/);
  assert.match(component, /props\.decorative\s*\?\s*""\s*:\s*props\.name/);
  assert.doesNotMatch(component, /editor-ruler|ssrf-guard|numkey|kokey/, "DDS must not duplicate Q-line routes");
  assert.match(styles, /\.oss-product-mark/);
  assert.match(styles, /block-size/);
  assert.doesNotMatch(styles, /\.oss-product-mark[^}]*animation\s*:/s);
  assert.match(await read("brand/index.html"), /https:\/\/devslab\.kr\/brand\/open-source\//);
  assert.match(await read("brand/index.html"), /oss-brand\/releases\/tag\/v0\.3\.0/);
});

test("public chrome requires injected copy and keeps forms native", async () => {
  const chrome = await read("packages/site-kit/src/solid/chrome.tsx");
  const layouts = await read("packages/site-kit/src/solid/layouts.tsx");
  const form = await read("packages/site-kit/src/solid/request-access.tsx");
  assert.match(chrome, /messages:\s*SiteMessages/);
  assert.match(layouts, /messages:\s*SiteMessages/);
  assert.match(layouts, /id="main-content"[^>]*tabIndex=\{-1\}/, "skip target must accept programmatic focus");
  assert.match(form, /<form/);
  assert.match(form, /type="email"/);
  assert.match(form, /aria-live/);
  assert.doesNotMatch(
    `${chrome}\n${layouts}\n${form}`,
    /props\.messages\.[A-Za-z0-9_]+\s*\?\?/,
    "translated product copy must never fall back at runtime",
  );
  assert.match(layouts, /href=\{props\.homeHref\}/, "not-found navigation must remain a semantic link");
});

test("TanStack adapter maps metadata without owning product facts", async () => {
  const source = await read("packages/site-kit/src/tanstack-start.mjs");
  assert.match(source, /toTanStackHead/);
  assert.match(source, /canonical/);
  assert.match(source, /hreflang/);
  assert.doesNotMatch(source, /VisionLinq|BookLinq|AskLinq/);
});

test("shared styles use logical properties and include RTL/mobile policies", async () => {
  const styles = await read("packages/site-kit/styles.css");
  assert.match(styles, /inline-size/);
  assert.match(styles, /border-inline-start/);
  assert.match(styles, /@media \(max-width:/);
  assert.doesNotMatch(styles, /\b(?:margin|padding|border)-(?:left|right)\b/);
  assert.match(styles, /\.dds-sr-only:focus/);
  const worker = await read("packages/site-kit/fixtures/worker/src/index.mjs");
  assert.match(worker, /environment: "preview"/);
});

test("Worker and browser fixtures consume adapters and prove hydration plus Arabic RTL", async () => {
  const [worker, browser, ssr, release, workflow, root] = await Promise.all([
    read("packages/site-kit/fixtures/worker/src/index.tsx"),
    read("tests/browser/site-kit.spec.ts"),
    read("packages/site-kit/src/solid/__tests__/ssr.test.tsx"),
    read("scripts/verify-solid-release.mjs"),
    read(".github/workflows/ci.yml"),
    json("package.json"),
  ]);
  assert.match(worker, /@devslab\/site-kit\/solid/);
  assert.match(worker, /toTanStackHead/);
  assert.match(worker, /renderToString/);
  assert.match(worker, /data-site-hydration/);
  assert.doesNotMatch(worker, /escapeHtml\(JSON\.stringify/, "hydration JSON must remain parseable script data");
  assert.match(ssr, /renderToString/);
  assert.match(release, /hydrate/);
  assert.match(release, /diagnostics\.length/);
  assert.match(browser, /375/);
  assert.match(browser, /1280/);
  assert.match(browser, /dir="rtl"/);
  assert.match(browser, /scrollWidth/);
  assert.match(browser, /toBeFocused/);
  assert.match(browser, /aria-expanded/);
  assert.equal(typeof root.scripts?.["verify:site-kit:browser"], "string");
  for (const gate of ["verify:source:stage3-4", "verify:solid:test", "verify:solid:a11y", "verify:solid:release", "verify:site-kit:ui", "verify:site-kit:browser", "verify:site-kit:release"]) {
    assert.match(workflow, new RegExp(gate.replaceAll(":", "\\:")), `${gate} must gate CI`);
  }
});

test("the TanStack adapter accepts metadata built from a product registry", async () => {
  // buildMetadata<Code> returns SiteMetadata<Code>; an adapter typed to the
  // family default alone made every product-registry consumer cast or
  // augment the module to get its head descriptors out.
  const dts = await readFile(new URL("../packages/site-kit/src/tanstack-start.d.mts", import.meta.url), "utf8");
  assert.match(dts, /toTanStackHead<Code extends string = SiteLocale>\(metadata: SiteMetadata<Code>, options\?: TanStackHeadOptions\)/);
  assert.match(dts, /toHtmlAttributes: <Code extends string = SiteLocale>\(metadata: SiteMetadata<Code>\)/);
  // D-031: the Tag Manager option and the standalone head entry are typed, and the result's `scripts` is optional (absent unless asked).
  // D-033 adds the font preload between them.
  assert.match(dts, /interface TanStackHeadOptions \{ icons\?: [^;]+; fontPreload\?: string \| readonly string\[\] \| undefined; gtm\?: string \| undefined \}/);
  assert.match(dts, /export declare function gtmHeadEntry\(containerId: string\): GtmHeadEntry;/);
  assert.match(dts, /scripts\?: GtmHeadEntry\[\]/);
});

test("the landing chrome keeps its touch targets, scroll offset and eyebrow hooks (D-029)", async () => {
  const [styles, sections, chrome] = await Promise.all([
    read("packages/site-kit/styles.css"),
    read("packages/site-kit/site-sections.css"),
    read("packages/site-kit/src/solid/chrome.tsx"),
  ]);
  // Touch: links are 44px targets like every button; the open narrow menu is 44px rows.
  const coarse = styles.match(/@media \(pointer: coarse\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  for (const selector of [".site-brand", ".site-nav__list a", ".site-footer__links a", ".site-footer__langs-trigger", ".site-footer__langs-list a"]) {
    assert.ok(coarse.includes(selector), `${selector} missing from the touch block`);
  }
  assert.match(coarse, /min-block-size:\s*44px/);
  assert.ok(styles.indexOf("@media (pointer: coarse)") < styles.indexOf("@media (max-width: 720px)"), "the narrow menu rows must come after the touch block to set their display");
  const narrow = styles.match(/@media \(max-width: 720px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(narrow, /\.site-nav__list a \{[^}]*min-block-size:\s*44px/);
  assert.match(narrow, /grid-template-rows: var\(--site-header-block-size, 64px\)/, "the closed narrow header keeps one height");
  // The sticky header's height is one property, and sections stop below it.
  assert.match(styles, /\.site-header__inner \{[^}]*min-block-size: var\(--site-header-block-size, 64px\)/);
  assert.match(sections, /scroll-margin-block-start: calc\(var\(--site-header-block-size, 64px\)/);
  // The 16px icon-mark size applies only beside a printed name, so a wordmark logo keeps its size.
  assert.match(styles, /\.site-footer__brand:has\(> strong\) :is\(img, svg\) \{[^}]*16px/);
  assert.doesNotMatch(styles, /\.site-footer__brand img, \.site-footer__brand svg/);
  // Eyebrow tracking and weight are hooks with the family defaults.
  assert.match(sections, /\.site-hero__eyebrow \{[^}]*letter-spacing: var\(--site-hero-eyebrow-tracking, \.18em\)/);
  assert.match(sections, /\.site-hero__eyebrow \{[^}]*font-weight: var\(--site-hero-eyebrow-weight, normal\)/);
  // The chrome reads handed-over JSX once (D-027, D-028).
  assert.match(chrome, /const details = createMemo\(\(\) => props\.details\)/);
  assert.equal((chrome.match(/const brand = createMemo\(\(\) => props\.brand\)/g) ?? []).length, 2, "header and footer each read brand once");
  assert.doesNotMatch(chrome, /props\.details(?!\))/, "details is read only through the memo");
  assert.doesNotMatch(chrome, /props\.brand\./, "brand is read only through the memo");
});

// D-033: the family font ships once, here. Node built-ins only — this file
// runs in the source stage, before any dependency is installed.
const familyNames = (stack) => stack.split(",").map((name) => name.trim().replace(/^['"]|['"]$/g, ""));
const fontFaces = (css) =>
  [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
    family: body.match(/font-family:\s*"([^"]+)";/)?.[1],
    style: body.match(/font-style:\s*([^;]+);/)?.[1],
    weight: body.match(/font-weight:\s*([^;]+);/)?.[1],
    display: body.match(/font-display:\s*([^;]+);/)?.[1],
    src: body.match(/src:\s*([^;]+);/)?.[1],
    range: body.match(/unicode-range:\s*([^;]+);/)?.[1],
  }));
const parseRange = (range) =>
  range.split(/\s*,\s*/).map((part) => {
    const match = part.match(/^U\+([0-9A-F]{1,6})(?:-([0-9A-F]{1,6}))?$/i);
    assert.ok(match, `unicode-range part ${part} is not U+XXXX or U+XXXX-YYYY`);
    const start = Number.parseInt(match[1], 16);
    const end = Number.parseInt(match[2] ?? match[1], 16);
    assert.ok(start <= end && end <= 0x10ffff, `unicode-range part ${part} is out of order or past U+10FFFF`);
    return [start, end];
  });
const covers = (ranges, codePoint) => ranges.some(([start, end]) => codePoint >= start && codePoint <= end);

test("fonts.css names the faces exactly as the token stacks do", async () => {
  const foundation = await json("tokens/foundation.json");
  const sans = familyNames(foundation.font.family.sans.$value);
  const mono = familyNames(foundation.font.family.mono.$value);
  const faces = fontFaces(await read("packages/site-kit/fonts.css"));
  assert.deepEqual([...new Set(faces.map(({ family }) => family))], ["Geist", "Geist Mono", "Pretendard"]);
  // The token's first sans name, its Korean fallback, and its first mono name
  // are the faces — so `var(--dds-font-family-sans)` resolves to these files
  // with no product rule in between.
  assert.equal(sans[0], "Geist");
  assert.equal(sans[1], "Pretendard");
  assert.equal(mono[0], "Geist Mono");
  for (const face of faces) {
    assert.equal(face.style, "normal");
    assert.equal(face.display, "swap", `${face.family} must swap, not block`);
    assert.match(face.weight, /^\d+ \d+$/, `${face.family} is a variable face with a weight range`);
    assert.match(face.src, /^url\("\.\/fonts\/(geist|geist-mono|pretendard)\/[\w.-]+\.woff2"\) format\("woff2"\)$/);
    assert.ok(face.range, `${face.family} ${face.src} has a unicode-range`);
  }
});

test("every url() in fonts.css is package-relative and names a real woff2 the pack ships", async () => {
  const { readFileSync, readdirSync, existsSync } = await import("node:fs");
  const pkg = new URL("../packages/site-kit/", import.meta.url);
  const css = await read("packages/site-kit/fonts.css");
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(([, url]) => url);
  assert.ok(urls.length > 0);
  for (const url of urls) {
    assert.ok(url.startsWith("./fonts/"), `${url}: relative to fonts.css, so a bundler rewrites it to the product's own /assets`);
    assert.doesNotMatch(url, /^(?:[a-z][a-z0-9+.-]*:|\/)/i, `${url}: no absolute, external or data: URL — font-src 'self'`);
    const file = new URL(url, pkg);
    assert.ok(existsSync(file), `${url} is missing`);
    const bytes = readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "wOF2", `${url} is not a woff2`);
    // Vite inlines assets under 4096 bytes as data: URIs by default, and a
    // product CSP of font-src 'self' blocks those. No face may be that small.
    assert.ok(bytes.length > 4096, `${url} is ${bytes.length} bytes — a bundler would inline it as data:`);
  }
  assert.equal(new Set(urls).size, urls.length, "each face is referenced once");
  const shipped = ["geist", "geist-mono", "pretendard"].flatMap((dir) =>
    readdirSync(new URL(`fonts/${dir}/`, pkg)).filter((name) => name.endsWith(".woff2")).map((name) => `./fonts/${dir}/${name}`),
  );
  assert.deepEqual([...shipped].sort(), [...urls].sort(), "fonts/ holds exactly the faces fonts.css references");
  const manifest = await json("packages/site-kit/package.json");
  assert.ok(manifest.files.includes("fonts") && manifest.files.includes("fonts.css"), "the pack must carry fonts/ and fonts.css");
  assert.equal(manifest.exports["./fonts.css"], "./fonts.css");
  assert.equal(manifest.exports["./fonts/*"], "./fonts/*", "a product imports a face with ?url to preload it");
  assert.ok(manifest.sideEffects.includes("./fonts.css"));
  assert.match(manifest.scripts.check, /build-fonts\.mjs --check/);
});

test("the faces' unicode ranges are well formed and split the way pages need", async () => {
  const faces = fontFaces(await read("packages/site-kit/fonts.css"));
  const byFamily = (family) => faces.filter((face) => face.family === family).map((face) => parseRange(face.range));
  for (const family of ["Geist", "Geist Mono"]) {
    const ranges = byFamily(family);
    assert.ok(ranges.length > 1, `${family} is split by script, not one file`);
    for (const codePoint of [..."AZaz09@€"].map((c) => c.codePointAt(0))) {
      assert.ok(ranges.some((face) => covers(face, codePoint)), `${family} covers U+${codePoint.toString(16)}`);
    }
  }
  const pretendard = byFamily("Pretendard");
  assert.ok(pretendard.length > 50, "Pretendard is the dynamic-subset build, not the 2 MB single file");
  // No code point in two Pretendard subsets: a page would fetch both files.
  const all = pretendard.flat().sort(([a], [b]) => a - b);
  for (let index = 1; index < all.length; index += 1) {
    assert.ok(all[index][0] > all[index - 1][1], `Pretendard subsets overlap at U+${all[index][0].toString(16)}`);
  }
  // Every precomposed Hangul syllable and compatibility jamo has a subset.
  for (let codePoint = 0xac00; codePoint <= 0xd7a3; codePoint += 1) {
    if (!covers(all, codePoint)) assert.fail(`no Pretendard subset covers U+${codePoint.toString(16)}`);
  }
  for (let codePoint = 0x3131; codePoint <= 0x318e; codePoint += 1) {
    if (!covers(all, codePoint)) assert.fail(`no Pretendard subset covers U+${codePoint.toString(16)}`);
  }
});

test("the font files match their manifest and ship their OFL licenses", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["packages/site-kit/scripts/build-fonts.mjs", "--check"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `build-fonts --check failed\n${result.stdout}\n${result.stderr}`);
  const fontsManifest = await json("packages/site-kit/fonts/manifest.json");
  for (const family of fontsManifest.families) {
    assert.equal(family.source.license, "OFL-1.1", family.family);
    assert.match(family.source.integrity, /^sha512-/, `${family.family} records the upstream tarball's integrity`);
    const license = await read(`packages/site-kit/fonts/${family.dir}/LICENSE.txt`);
    assert.match(license, /SIL Open Font License, Version 1\.1/, `${family.family} license text`);
  }
  for (const readme of ["packages/site-kit/README.md", "packages/site-kit/README.ko.md"]) {
    const text = await read(readme);
    assert.match(text, /fonts\.css/, `${readme} documents fonts.css`);
    assert.match(text, /OFL|Open Font License/, `${readme} names the font licenses`);
  }
});
