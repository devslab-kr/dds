import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("public foundation packages use the @devslab scope, source-available license, and TypeScript 7", async () => {
  const expected = {
    "packages/dds-tokens/package.json": "@devslab/dds-tokens",
    "packages/dds-css/package.json": "@devslab/dds-css",
    "packages/dds-icons/package.json": "@devslab/dds-icons",
  };

  // The fixed group moves in lockstep, so one manifest is the source of
  // truth for the version and the others must agree with it. A literal here
  // was a test that every release broke — it asserted that no release had
  // happened.
  const { version } = await json("packages/dds-tokens/package.json");
  assert.match(version, /^\d+\.\d+\.\d+$/);

  for (const [path, name] of Object.entries(expected)) {
    const manifest = await json(path);
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, version, `${path} must move in lockstep with dds-tokens`);
    assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
    assert.equal(manifest.publishConfig?.registry, "https://registry.npmjs.org");
    assert.equal(manifest.publishConfig?.access, "public");
    assert.equal(manifest.publishConfig?.provenance, true);
  }

  const tokens = await json("packages/dds-tokens/package.json");
  assert.equal(tokens.devDependencies.typescript, "7.0.2");
});

test("workspace exposes deterministic foundation and release verification", async () => {
  const root = await json("package.json");
  for (const script of ["verify:names", "verify:foundation", "verify:release"]) {
    assert.equal(typeof root.scripts?.[script], "string", `${script} is required`);
  }
  assert.equal(root.devDependencies?.["@changesets/cli"], "2.29.7");

  const config = await json(".changeset/config.json");
  assert.deepEqual(config.fixed, [["@devslab/dds-tokens", "@devslab/dds-css", "@devslab/dds-icons", "@devslab/dds-solid", "@devslab/site-kit", "@devslab/dds-table", "@devslab/dds-table-solid", "@devslab/dds-react", "@devslab/dds-table-react", "@devslab/dds-vue", "@devslab/dds-table-vue", "@devslab/dds-svelte"]]);
  assert.equal(config.access, "public");
  assert.match(await read("LICENSE"), /DevsLab Source-Available License 1\.0/);
  const workflow = await read(".github/workflows/release.yml");
  // The version PR must carry the lockfile (0.5.0 failed frozen-lockfile on
  // main), and the refresh must live in the npm script: changesets/action
  // passes everything after the first word of `version:` to changesets as
  // arguments, and changesets rejects them.
  assert.equal(root.scripts["version-packages"], "changeset version && pnpm install --lockfile-only");
  assert.match(workflow, /^\s*version: pnpm version-packages\s*$/m);
  assert.match(workflow, /registry-url:\s*https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /npm publish|changeset publish|pnpm release/);
});

test("unpublished DDS packages bootstrap from this workspace", async () => {
  const internalDependencies = {
    "packages/dds-solid/package.json": [
      "@devslab/dds-css",
      "@devslab/dds-icons",
      "@devslab/dds-tokens",
    ],
    "packages/site-kit/package.json": ["@devslab/dds-solid"],
  };

  // `changeset version` rewrites these to `workspace:<the new version>` on
  // every release (updateInternalDependencies: "patch"), so the expectation
  // is the specifier's shape and the lockstep version, not a literal.
  const { version } = await json("packages/dds-tokens/package.json");
  for (const [path, names] of Object.entries(internalDependencies)) {
    const manifest = await json(path);
    assert.equal(manifest.version, version, `${path} must move in lockstep with dds-tokens`);
    for (const name of names) {
      assert.equal(
        manifest.dependencies?.[name],
        `workspace:${version}`,
        `${path} must resolve unpublished ${name} from the local release workspace`,
      );
    }
  }
});

test("CI keeps source-only gates separate and runs dependency-backed Stage 1-2 gates", async () => {
  const root = await json("package.json");
  const workflow = await read(".github/workflows/ci.yml");
  assert.equal(typeof root.scripts?.["verify:source:stage1-2"], "string");
  assert.doesNotMatch(root.scripts["verify:source:stage1-2"], /token-build|\bdist\b/, "source-only gate cannot require ignored build artifacts");
  assert.match(workflow, /source-contracts:/);
  assert.match(workflow, /pnpm run verify:source:stage1-2/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  const foundationConfig = await read("playwright.foundation.config.ts");
  assert.doesNotMatch(foundationConfig, /channel:\s*["']chrome["']/);
  for (const gate of [
    "verify:canary:dependencies",
    "verify:canary:test",
    "verify:canary:build",
    "verify:canary:preview",
    "verify:foundation",
    "verify:release",
  ]) assert.match(workflow, new RegExp(`pnpm run ${gate.replaceAll(":", "\\:")}`), `${gate} must gate CI`);
});

test("every publishable, non-foundation package's verify:<surface> scripts are wired into CI and release", async () => {
  const root = await json("package.json");
  const ci = await read(".github/workflows/ci.yml");
  const release = await read(".github/workflows/release.yml");

  // The foundation trio (dds-tokens/dds-css/dds-icons) ships one joint gate
  // (verify:foundation*, verify:release) instead of a per-package
  // verify:<surface>:* family — already asserted by "workspace exposes
  // deterministic foundation and release verification" above, so it is
  // excluded here rather than re-checked. Every other publishable package
  // follows the per-package surface convention dds-solid established
  // (verify:<surface>:test/:a11y/:..., verify:<surface>:release), so both
  // sides of this test — which packages must be wired, and which scripts
  // wire them — are derived from the workspace and from root package.json
  // rather than hardcoded. This is the guard for the gap dds-table shipped
  // with: its verify:table:* scripts existed in package.json but were
  // invoked by neither workflow, so its tests, its a11y gate, and its
  // release check (pack, publish dry-run, fresh-consumer install) never
  // ran anywhere.
  const foundationTrio = new Set(["@devslab/dds-tokens", "@devslab/dds-css", "@devslab/dds-icons"]);
  const packageDirs = await readdir(new URL("../packages/", import.meta.url));
  const expectedSurfaces = new Set();
  const packagesByName = new Map();
  for (const dir of packageDirs) {
    const manifest = await json(`packages/${dir}/package.json`);
    packagesByName.set(manifest.name, { dir, manifest });
    // The legacy table is exercised by table-solid release parity, not a duplicated suite.
    if (manifest.private || foundationTrio.has(manifest.name) || manifest.name === "@devslab/dds-table") continue;
    expectedSurfaces.add(dir.replace(/^dds-/, ""));
  }

  const surfaceScripts = new Map(); // surface -> Set(suffix), e.g. "table" -> {"test", "a11y", "release"}
  for (const script of Object.keys(root.scripts ?? {})) {
    const match = script.match(/^verify:([a-z0-9-]+):(.+)$/);
    if (!match) continue;
    const [, surface, suffix] = match;
    if (surface === "foundation" || surface === "canary" || surface === "source" || surface === "table") continue;
    if (!surfaceScripts.has(surface)) surfaceScripts.set(surface, new Set());
    surfaceScripts.get(surface).add(suffix);
  }

  assert.deepEqual(
    [...surfaceScripts.keys()].sort(),
    [...expectedSurfaces].sort(),
    "every non-foundation publishable package must define its own verify:<surface>:* scripts, and vice versa",
  );

  const invokedScripts = (workflow) => [...workflow.matchAll(/^\s*-\s*run:\s*pnpm run ([\w:-]+)\s*$/gm)]
    .map(([, script]) => script);
  // These selected-file commands remain available locally. Each can be
  // consolidated only while its package test executes the same Vitest suite.
  const includedChecks = new Map();
  for (const surface of ["solid", "table-solid", "react"]) {
    const pkg = packagesByName.get(`@devslab/dds-${surface}`);
    const file = "src/__tests__/a11y.test.tsx";
    await read(`packages/${pkg.dir}/${file}`);
    const suite = surface === "react" ? "vitest run" : "vitest run --config vitest.config.ts";
    assert.equal(root.scripts[`verify:${surface}:a11y`], `pnpm --filter ${pkg.manifest.name} run test:a11y`);
    assert.equal(pkg.manifest.scripts["test:a11y"], `${suite} ${file}`);
    assert.ok(pkg.manifest.scripts.test.split(" && ").includes(suite));
    const config = await read(`packages/${pkg.dir}/vitest.config.ts`);
    const patterns = (key) => [...(config.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`))?.[1] ?? "")
      .matchAll(/["']([^"']+)["']/g)].map(([, pattern]) => pattern);
    assert.ok(patterns("include").some((pattern) => [file, "src/__tests__/*.test.tsx"].includes(pattern)));
    assert.ok(patterns("exclude").every((pattern) => pattern === "src/__tests__/ssr.test.tsx"),
      "consolidated a11y checks must not be excluded from the package suite");
    assert.ok(root.scripts[`verify:${surface}:test`].split(" && ")
      .includes(`pnpm --filter ${pkg.manifest.name} run test`));
    includedChecks.set(`verify:${surface}:a11y`, `verify:${surface}:test`);
  }
  const covered = (script, workflow) => {
    const invoked = invokedScripts(workflow);
    return invoked.includes(script)
      || invoked.includes(includedChecks.get(script))
      || (includedChecks.has(script) && invoked.some((name) => root.scripts[name] === root.scripts[includedChecks.get(script)]))
      // Identical commands (currently site-kit i18n/SEO) protect the same checks.
      || invoked.some((name) => root.scripts[name] === root.scripts[script]);
  };

  for (const [surface, suffixes] of surfaceScripts) {
    assert.ok(suffixes.has("release"), `verify:${surface}:release is required`);
    for (const suffix of suffixes) {
      const script = `verify:${surface}:${suffix}`;
      const [workflow, workflowName] = suffix === "release" ? [release, "release.yml"] : [ci, "ci.yml"];
      assert.ok(
        covered(script, workflow),
        `${script} must run directly or through an equivalent check in ${workflowName}`,
      );
    }
  }
});

test("buttons preserve readable CJK labels and expose 44px touch targets", async () => {
  const button = await read("packages/dds-css/src/button.css");
  const iconButton = await read("packages/dds-css/src/iconbutton.css");
  assert.match(button, /white-space:\s*normal/);
  assert.match(button, /overflow-wrap:\s*anywhere/);
  assert.match(button, /min-block-size:\s*44px/);
  assert.match(iconButton, /min-inline-size:\s*44px/);
  assert.match(iconButton, /min-block-size:\s*44px/);
});

test("preview pages break Korean between words; dds.css leaves that to each product's root (D-030)", async () => {
  const root = /:where\(\[lang\|="ko"\]\)\s*\{\s*word-break:\s*keep-all;\s*overflow-wrap:\s*break-word;\s*\}/;
  const reset = /:where\(\[lang\]:not\(\[lang\|="ko"\]\)\)\s*\{\s*word-break:\s*normal;\s*overflow-wrap:\s*normal;\s*\}/;
  for (const page of ["preview/index.html", "preview/components.html", "preview/icons.html"]) {
    const html = await read(page);
    assert.match(html, /<html lang="ko">/, `${page} must declare its language — the rule keys on it`);
    assert.match(html, root, `${page} must set keep-all on its Korean root`);
    assert.match(html, reset, `${page} must return other languages (ja/zh) to normal breaking`);
    // Only the root pair: keep-all on single elements misses table cells and
    // lists, and an element-level word-break: normal undoes it (GitLinq's guide
    // did that inside a phone media query).
    assert.equal(html.match(/word-break:/g).length, 2, `${page} must not set word-break per element`);
  }
  const cssFiles = await readdir(new URL("../packages/dds-css/src/", import.meta.url));
  const bundleSources = (await Promise.all(
    cssFiles.filter((name) => name.endsWith(".css")).map((name) => read(`packages/dds-css/src/${name}`)),
  )).join("\n");
  assert.doesNotMatch(bundleSources, /keep-all/, "dds.css must not change Korean line breaking for every consumer (D-030)");
});

// D-047: a focus ring drawn outside a control's own border or fill, with a
// gap between them, reads as a second line around the control. Rings sit
// flush (var(--dds-focus-offset)) or inside the box (a negative offset);
// a positive offset is allowed only on the few selectors below, each with
// the reason recorded in D-047. Adding a selector here is a design decision —
// update D-047 with it.
const FOCUS_GAP_ALLOWED = new Set([
  ".dds-check__input:focus-visible", // 18px glyph box: flush reads as "heavier box"
  ".dds-switch__input:focus-visible", // grey off track ≈ focus grey: flush merges
  ".dds-table__sort:focus-visible", // borderless, zero-padding header label
  ".site-footer__langs-trigger:focus-visible", // inline footer text
  ".site-consent__link:focus-visible, .site-consent-trigger:focus-visible", // inline text links
]);

async function focusRules() {
  const sources = [];
  const cssDir = "packages/dds-css/src/";
  for (const name of (await readdir(new URL(`../${cssDir}`, import.meta.url))).filter((n) => n.endsWith(".css")))
    sources.push(`${cssDir}${name}`);
  sources.push("packages/site-kit/styles.css", "packages/site-kit/site-sections.css",
    "packages/dds-table-react/src/styles.css", "packages/dds-table-vue/styles.css");
  const rules = [];
  for (const file of sources) {
    const css = (await read(file)).replace(/\/\*[\s\S]*?\*\//g, "");
    // Innermost `selector { declarations }` blocks; @media wrappers fall away.
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = match[1].trim().replace(/\s+/g, " ");
      if (!/:focus(?:-visible|-within)?\b|\[data-focus-visible\]/.test(selector)) continue;
      const offset = match[2].match(/outline-offset\s*:\s*([^;]+)/);
      if (offset) rules.push({ file, selector, offset: offset[1].trim() });
    }
  }
  return rules;
}

test("focus rings never leave a gap outside a bordered or filled control (D-047)", async () => {
  const rules = await focusRules();
  assert.ok(rules.length > 20, "the focus-rule scan found too few rules to be reading the CSS");
  const isFlush = (v) => v === "var(--dds-focus-offset)";
  const isInset = (v) => /^-\d/.test(v) || /^calc\(var\(--dds-space-2\) \* -[\d.]+\)$/.test(v)
    || /^calc\(-1 \* var\(--dds-space-2\)\)$/.test(v);
  for (const { file, selector, offset } of rules) {
    if (FOCUS_GAP_ALLOWED.has(selector)) {
      assert.match(offset, /^(?:2px|var\(--dds-space-2\))$/, `${file}: ${selector} keeps the documented 2px gap`);
      continue;
    }
    assert.ok(isFlush(offset) || isInset(offset),
      `${file}: ${selector} uses outline-offset ${offset} — use var(--dds-focus-offset) (flush) or an inset offset; a gap doubles the line (D-047)`);
  }
  // Every allowed gap must still exist, so the list cannot rot into a blanket pass.
  for (const selector of FOCUS_GAP_ALLOWED)
    assert.ok(rules.some((rule) => rule.selector === selector), `${selector} is allow-listed but no longer found`);
  const buttons = rules.filter((rule) => /\.dds-(?:btn|iconbtn|chip):focus-visible$/.test(rule.selector));
  assert.equal(buttons.length, 3);
  for (const rule of buttons) assert.equal(rule.offset, "var(--dds-focus-offset)", `${rule.selector} must sit flush`);

  // Unfilled bordered controls paint their own border in the focus color while
  // focused, so border + ring are one edge of one colour, not a pale line
  // inside a dark ring. Filled buttons (primary, danger) are excluded.
  for (const [file, selector] of [
    ["button.css", ".dds-btn:not(.dds-btn--primary):not(.dds-btn--danger):focus-visible"],
    ["iconbutton.css", ".dds-iconbtn:focus-visible"],
    ["chip.css", ".dds-chip:focus-visible"],
  ]) {
    const css = (await read(`packages/dds-css/src/${file}`)).replace(/\/\*[\s\S]*?\*\//g, "");
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].trim() === selector);
    assert.ok(
      blocks.some((m) => /border-color\s*:\s*var\(--dds-color-border-focus\)/.test(m[2])),
      `${file}: ${selector} must set border-color: var(--dds-color-border-focus) (D-047)`,
    );
  }

  const foundation = await json("tokens/foundation.json");
  assert.deepEqual(foundation.focus.offset, { $value: 0, $type: "dimension" }, "focus.offset is the flush offset (0)");
});

test("buttons rendered as links carry no anchor underline", async () => {
  const button = await read("packages/dds-css/src/button.css");
  const base = button.slice(button.indexOf(".dds-btn {"), button.indexOf("}", button.indexOf(".dds-btn {")));
  assert.match(base, /text-decoration:\s*none/, ".dds-btn must reset the UA anchor underline");
  assert.doesNotMatch(button.replace(base, ""), /text-decoration:\s*(underline|revert|initial)/, "no .dds-btn state may re-add an underline");
});

test("CSS defines RTL, forced-colors, and reduced-motion policies", async () => {
  const base = await read("packages/dds-css/src/base.css");
  const cssFiles = await readdir(new URL("../packages/dds-css/src/", import.meta.url));
  const bundleSources = (await Promise.all(
    cssFiles.filter((name) => name.endsWith(".css")).map((name) => read(`packages/dds-css/src/${name}`)),
  )).join("\n");

  assert.match(base, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(base, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(base, /\[dir=["']rtl["']\]/);
  assert.doesNotMatch(bundleSources, /\b(?:margin|padding|border)-(?:left|right)\b/);
});

test("icons publish an explicit direction policy", async () => {
  const policy = await json("packages/dds-icons/direction-policy.json");
  assert.equal(policy.schemaVersion, 1);
  assert.ok(policy.mirrorInRtl.includes("arrow-left"));
  assert.ok(policy.mirrorInRtl.includes("arrow-right"));
  assert.ok(policy.keepDirection.includes("external-link"));
});

test("foundation browser source asserts themes, long European labels, and media policies", async () => {
  const browser = await read("tests/browser/foundation.spec.ts");
  assert.match(browser, /data-theme/);
  assert.match(browser, /Deutsch/);
  assert.match(browser, /Portugu[eê]s/);
  assert.match(browser, /colorScheme/);
  assert.match(browser, /forcedColorAdjust/);
  assert.match(browser, /transitionDuration/);
  assert.match(browser, /animationDuration/);
});

test("status text clears 4.5:1 on its own background in both themes (D-049)", async () => {
  const palette = JSON.parse(await read("tokens/palette.json"));
  const hex = (reference) => {
    let node = palette;
    for (const segment of reference.slice(1, -1).split(".")) node = node[segment];
    return node.$value;
  };
  const luminance = (value) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const theme of ["light", "dark"]) {
    const { status } = JSON.parse(await read(`tokens/semantic.${theme}.json`)).color;
    for (const name of ["success", "warning", "danger", "info"]) {
      const ratio = contrast(hex(status[name].$value), hex(status[`${name}-bg`].$value));
      assert.ok(ratio >= 4.5, `${theme} status.${name} on status.${name}-bg is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("a form control's edge is 3:1 against its surface, and placeholder text is 4.5:1 (D-050)", async () => {
  const palette = JSON.parse(await read("tokens/palette.json"));
  const hex = (reference) => {
    if (!reference.startsWith("{")) return reference;
    let node = palette;
    for (const segment of reference.slice(1, -1).split(".")) node = node[segment];
    return node.$value;
  };
  const luminance = (value) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const theme of ["light", "dark"]) {
    const { bg, border, text } = JSON.parse(await read(`tokens/semantic.${theme}.json`)).color;
    // Controls sit on the page, on a quiet section and on a card or sheet.
    for (const surface of ["default", "subtle", "elevated"]) {
      const on = hex(bg[surface].$value);
      const edge = contrast(hex(border.control.$value), on);
      assert.ok(edge >= 3, `${theme} border.control on bg.${surface} is ${edge.toFixed(2)}:1`);
      const hint = contrast(hex(text.muted.$value), on);
      assert.ok(hint >= 4.5, `${theme} text.muted on bg.${surface} is ${hint.toFixed(2)}:1`);
    }
    // Why border.control exists: the emphasized line is far too pale to mark a control.
    const pale = contrast(hex(border.strong.$value), hex(bg.default.$value));
    assert.ok(pale < 3, `${theme} border.strong is ${pale.toFixed(2)}:1 — if it reached 3:1 border.control would be redundant`);
  }
});

test("form controls draw their resting edge in border.control, not border.strong (D-050)", async () => {
  for (const name of ["checkbox-radio", "choice", "date-picker", "input", "number-input", "select", "textarea", "textfield"]) {
    const css = await read(`packages/dds-css/src/${name}.css`);
    // border.strong may appear only as the fallback for a token sheet older than this
    // token: without it, upgrading dds-css alone would leave every control with no edge.
    const fallback = "var(--dds-color-border-control, var(--dds-color-border-strong))";
    assert.ok(css.includes(fallback), `${name}.css must fall back to border.strong`);
    assert.doesNotMatch(css.replaceAll(fallback, ""), /--dds-color-border-(control|strong)/, `${name}.css draws an edge outside the fallback pair`);
  }
  // The segmented track is a control edge too. Its file also uses border.strong for other
  // things, so only the track rule and the bare variable are checked.
  const segmented = await read("packages/dds-css/src/segmented-control.css");
  assert.match(segmented, /\.dds-segmented__track\s*\{[^}]*border:\s*1px solid var\(--dds-color-border-control, var\(--dds-color-border-strong\)\)/);
  assert.doesNotMatch(segmented, /var\(--dds-color-border-control\)/);
});

test("bg.raised is lighter than bg.subtle and text reads on it, and the chosen segment uses it (D-054)", async () => {
  const palette = JSON.parse(await read("tokens/palette.json"));
  const hex = (reference) => {
    if (!reference.startsWith("{")) return reference;
    let node = palette;
    for (const segment of reference.slice(1, -1).split(".")) node = node[segment];
    return node.$value;
  };
  const luminance = (value) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const theme of ["light", "dark"]) {
    const { bg, text } = JSON.parse(await read(`tokens/semantic.${theme}.json`)).color;
    const raised = hex(bg.raised.$value);
    assert.ok(luminance(raised) > luminance(hex(bg.subtle.$value)), `${theme} bg.raised must be lighter than bg.subtle`);
    for (const name of ["primary", "secondary"]) {
      const ratio = contrast(hex(text[name].$value), raised);
      assert.ok(ratio >= 4.5, `${theme} text.${name} on bg.raised is ${ratio.toFixed(2)}:1`);
    }
  }
  const segmented = await read("packages/dds-css/src/segmented-control.css");
  assert.match(segmented, /\.dds-segmented__item\[data-state="checked"\]\s*\{[^}]*background:\s*var\(--dds-color-bg-raised\)/);
});

test("the chosen segment's face slides on base motion and stops under reduced motion (D-055)", async () => {
  const css = await read("packages/dds-css/src/segmented-control.css");
  assert.match(css, /\.dds-segmented__indicator\s*\{[^}]*--transition-duration:\s*var\(--dds-motion-duration-base\)/);
  assert.match(css, /\.dds-segmented__indicator\s*\{[^}]*--transition-timing-function:\s*var\(--dds-motion-easing-standard\)/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{[^@]*\.dds-segmented__indicator\s*\{\s*--transition-duration:\s*0ms/);
  // Until measured, the chosen item keeps its own face; once placed, the indicator is the face.
  assert.match(css, /\.dds-segmented__indicator\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /:has\(> \.dds-segmented__indicator:not\(\[hidden\]\)\)\s*\.dds-segmented__item\[data-state="checked"\]\s*\{[^}]*background:\s*transparent/);
  for (const file of ["packages/dds-react/src/segmented-control.tsx", "packages/dds-solid/src/segmented-control.tsx"]) {
    assert.match(await read(file), /<SegmentGroup\.Indicator class(Name)?="dds-segmented__indicator"/, file);
  }
  assert.match(await read("packages/dds-vue/src/controls.ts"), /class: 'dds-segmented__indicator'/);
});
