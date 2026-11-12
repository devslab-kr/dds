import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { GENERATED_ICONS_HEADER, generateAndroidIcons, renderAndroidIcons } from "../scripts/generate-android-icons.mjs";
import { GENERATED_HEADER, generateAndroidTokens, renderAndroidTokens } from "../scripts/generate-android-tokens.mjs";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const kotlinDir = "android/dds-tokens/src/main/kotlin/kr/devslab/dds/tokens";
const resDir = "android/dds-tokens/src/main/res";

/** Follow a `{palette.a.b}` reference by hand, so the expectation does not come from the generator. */
async function paletteHex(reference) {
  let node = await readJson("tokens/palette.json");
  for (const segment of reference.slice(1, -1).split(".")) node = node[segment];
  return node.$value;
}

test("android colors resolve to the palette value the semantic files point at", async () => {
  const light = await readJson("tokens/semantic.light.json");
  const dark = await readJson("tokens/semantic.dark.json");
  const brand = (await paletteHex(light.color.bg.brand.$value)).slice(1).toUpperCase();
  const darkCanvas = (await paletteHex(dark.color.bg.default.$value)).slice(1).toUpperCase();

  const files = generateAndroidTokens();
  const kotlin = files.get(`${kotlinDir}/DdsColorTokens.kt`);
  const lightBlock = kotlin.slice(kotlin.indexOf("object DdsLightColors"), kotlin.indexOf("object DdsDarkColors"));
  const darkBlock = kotlin.slice(kotlin.indexOf("object DdsDarkColors"));
  assert.match(lightBlock, new RegExp(`const val bgBrand: Long = 0xFF${brand}\\b`));
  assert.match(darkBlock, new RegExp(`const val bgDefault: Long = 0xFF${darkCanvas}\\b`));

  assert.match(files.get(`${resDir}/values/dds_tokens.xml`), new RegExp(`<color name="dds_color_bg_brand">#FF${brand}</color>`));
  assert.match(files.get(`${resDir}/values-night/dds_tokens.xml`), new RegExp(`<color name="dds_color_bg_default">#FF${darkCanvas}</color>`));
});

test("night resources hold only what differs, so one app override rebrands both themes", async () => {
  const light = await readJson("tokens/semantic.light.json");
  const dark = await readJson("tokens/semantic.dark.json");
  const night = generateAndroidTokens().get(`${resDir}/values-night/dds_tokens.xml`);
  // The brand fill is the same token in both themes: it must not be repeated under night.
  assert.equal(light.color.bg.brand.$value, dark.color.bg.brand.$value);
  assert.doesNotMatch(night, /dds_color_bg_brand"/);
  // A color that does change with the theme is there.
  assert.notEqual(light.color.bg["brand-subtle"].$value, dark.color.bg["brand-subtle"].$value);
  assert.match(night, /dds_color_bg_brand_subtle"/);
});

test("alpha colors move the alpha byte to the front (web #RRGGBBAA, Android AARRGGBB)", async () => {
  const light = await readJson("tokens/semantic.light.json");
  const dim = (await paletteHex(light.color.overlay.dim.$value)).slice(1).toUpperCase(); // RRGGBBAA
  const argb = dim.slice(6) + dim.slice(0, 6);
  const kotlin = generateAndroidTokens().get(`${kotlinDir}/DdsColorTokens.kt`);
  assert.match(kotlin, new RegExp(`const val overlayDim: Long = 0x${argb}\\b`));
});

test("native-only values and motion come from the token files", async () => {
  const native = (await readJson("tokens/native.json")).native;
  const foundation = await readJson("tokens/foundation.json");
  const files = generateAndroidTokens();
  const dimens = files.get(`${kotlinDir}/DdsDimens.kt`);
  const motion = files.get(`${kotlinDir}/DdsMotionTokens.kt`);

  assert.match(dimens, new RegExp(`const val md: Int = ${native.control.md.$value}\\b`));
  assert.match(dimens, new RegExp(`const val twoLine: Int = ${native.row["two-line"].$value}\\b`));
  assert.match(motion, new RegExp(`const val fastMs: Int = ${parseInt(foundation.motion.duration.fast.$value, 10)}\\b`));
  assert.match(motion, new RegExp(`const val shortMs: Int = ${parseInt(native.motion.duration.short.$value, 10)}\\b`));
  assert.match(motion, new RegExp(`const val staggerLimit: Int = ${native.motion.stagger.limit.$value}\\b`));
  const [x1, y1, x2, y2] = foundation.motion.easing.exit.$value;
  assert.ok(motion.includes(`val exit = DdsEasingToken(${x1}f, ${y1}f, ${x2}f, ${y2}f)`));
});

test("the screen frame numbers are generated for Kotlin and XML", () => {
  const files = generateAndroidTokens();
  const dimens = files.get(`${kotlinDir}/DdsDimens.kt`);
  const screen = dimens.slice(dimens.indexOf("object DdsScreen"));
  const bar = dimens.slice(dimens.indexOf("object DdsBar"), dimens.indexOf("object DdsIcon"));
  const expected = [
    [screen, "breakpointExpanded", 840],
    [screen, "bodyMax", 680],
    [screen, "listPane", 264],
    [screen, "centeredMax", 400],
    [bar, "rail", 80],
    [bar, "topTall", 104],
  ];
  for (const [block, name, value] of expected) {
    assert.match(block, new RegExp(`const val ${name}: Int = ${value}\\b`));
  }
  const xml = files.get(`${resDir}/values/dds_tokens.xml`);
  for (const [name, value] of [
    ["dds_screen_breakpoint_expanded", 840],
    ["dds_screen_body_max", 680],
    ["dds_screen_list_pane", 264],
    ["dds_screen_centered_max", 400],
    ["dds_bar_rail", 80],
    ["dds_bar_top_tall", 104],
  ]) {
    assert.match(xml, new RegExp(`<dimen name="${name}">${value}dp</dimen>`));
  }
});

test("every generated file carries the do-not-edit header", () => {
  for (const [path, content] of generateAndroidTokens()) {
    assert.ok(content.includes(GENERATED_HEADER), `${path} is missing the generated header`);
  }
});

test("a token of an unknown $type is a build error, not a skipped token", async () => {
  const documents = await Promise.all(
    ["palette.json", "foundation.json", "semantic.light.json", "native.json"].map((f) => readJson(`tokens/${f}`)),
  );
  const dark = await Promise.all(["palette.json", "semantic.dark.json"].map((f) => readJson(`tokens/${f}`)));
  documents[3].native.touch.bogus = { $value: 1, $type: "bogus" };
  assert.throws(() => renderAndroidTokens({ light: documents, dark, sourceSha256: "x" }), /bogus/);
});

test("committed Android token files match what the token files generate", async () => {
  for (const [path, content] of generateAndroidTokens()) {
    // Same normalization as `--check`: a CRLF checkout is not a stale file.
    const committed = await readFile(new URL(path, root), "utf8").then((text) => text.replaceAll("\r\n", "\n"), () => null);
    assert.equal(committed, content, `${path} is out of date — run: node scripts/generate-android-tokens.mjs`);
  }
});

test("a hand-written color outside the generated files is reported with file and line", async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { checkAndroidSources } = await import("../scripts/check-android-sources.mjs");

  const dir = await mkdtemp(join(tmpdir(), "dds-android-"));
  try {
    await mkdir(join(dir, "dds-compose/src/main/kotlin"), { recursive: true });
    await mkdir(join(dir, "dds-tokens/src/main/kotlin"), { recursive: true });
    await writeFile(join(dir, "dds-tokens/src/main/kotlin/Generated.kt"), "const val bgBrand: Long = 0xFF06B6D4\n");
    await writeFile(join(dir, "dds-compose/src/main/kotlin/Clean.kt"), "val a = DdsTheme.colors.bgBrand\n");
    assert.deepEqual(checkAndroidSources(dir), []);

    await writeFile(join(dir, "dds-compose/src/main/kotlin/Typed.kt"), "val ok = 1\nval brand = Color(0xFF0E7490)\n");
    await writeFile(join(dir, "dds-compose/src/main/kotlin/colors.xml"), '<color name="x">#0891B2</color>\n');
    const found = checkAndroidSources(dir);
    assert.equal(found.length, 2);
    assert.ok(found.some((v) => v.startsWith("android/dds-compose/src/main/kotlin/Typed.kt:2:")));
    assert.ok(found.some((v) => v.startsWith("android/dds-compose/src/main/kotlin/colors.xml:1:")));

    // The ways around a naive check: short hex, a literal split over two lines, a bare ARGB integer.
    await writeFile(join(dir, "dds-compose/src/main/kotlin/Typed.kt"), "val a = Color(\n    0xFF0E7490,\n)\nval b = 0xFF0891B2.toInt()\n");
    await writeFile(join(dir, "dds-compose/src/main/kotlin/colors.xml"), '<color name="x">#0cf</color>\n<item name="y">#f0cf</item>\n');
    const sneaky = checkAndroidSources(dir);
    assert.deepEqual(
      sneaky.map((v) => v.split(": ")[0]).sort(),
      ["Typed.kt:1", "Typed.kt:2", "Typed.kt:4", "colors.xml:1", "colors.xml:2"].map((f) => `android/dds-compose/src/main/kotlin/${f}`),
    );

    // Prose may name a color: comments are not code.
    await writeFile(join(dir, "dds-compose/src/main/kotlin/Typed.kt"), "// was Color(0xFF0E7490)\n/* #0891B2 */\nval ok = 1\n");
    await writeFile(join(dir, "dds-compose/src/main/kotlin/colors.xml"), "<!-- #0891B2 -->\n<resources />\n");
    assert.deepEqual(checkAndroidSources(dir), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

test("android icons are generated from the web icon files and committed", async () => {
  const { readdir } = await import("node:fs/promises");
  const names = (await readdir(new URL("packages/dds-icons/svg/", root))).filter((f) => f.endsWith(".svg"));
  for (const [path, content] of generateAndroidIcons()) {
    assert.ok(content.includes(GENERATED_ICONS_HEADER));
    // One vector per core SVG, none from the site- set (a subfolder).
    assert.equal((content.match(/: ImageVector by lazy/g) ?? []).length, names.length);
    const committed = await readFile(new URL(path, root), "utf8").then((text) => text.replaceAll("\r\n", "\n"), () => null);
    assert.equal(committed, content, `${path} is out of date — run: node scripts/generate-android-icons.mjs`);
  }
});

test("icon shapes become path data, and directional icons mirror", () => {
  const out = renderAndroidIcons(
    [
      { name: "dot", svg: svg('<circle cx="12" cy="12" r="3"></circle>') },
      { name: "box", svg: svg('<rect x="3" y="3" width="7" height="7" rx="1"></rect>') },
      { name: "arrow-left", svg: svg('<path d="M19 12H5"></path>') },
    ],
    { mirrorInRtl: ["arrow-left"] },
  );
  // A circle of radius 3 at (12,12): starts at its left edge and goes round in two half arcs.
  assert.ok(out.includes('ddsIcon("Dot", "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z")'));
  // A 7x7 box rounded by 1: top edge is 5 long, then four quarter arcs.
  assert.ok(out.includes('"M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z"'));
  assert.ok(out.includes('ddsIcon("ArrowLeft", "M19 12H5", autoMirror = true)'));
  assert.ok(out.includes("DDS_ICON_STROKE: Float = 1.6f"));
});

test("an icon the generator cannot render is a build error", () => {
  const policy = { mirrorInRtl: [] };
  assert.throws(() => renderAndroidIcons([{ name: "x", svg: svg('<line x1="0" y1="0" x2="1" y2="1"></line>') }], policy), /<line>/);
  assert.throws(() => renderAndroidIcons([{ name: "x", svg: svg('<path d="M0 0" fill="red"></path>') }], policy), /fill/);
  assert.throws(() => renderAndroidIcons([{ name: "x", svg: svg('<path d="M0 0"></path>').replace("1.6", "2") }, { name: "y", svg: svg('<path d="M0 0"></path>') }], policy), /stroke/);
  assert.throws(() => renderAndroidIcons([{ name: "x", svg: svg('<path d="M0 0"></path>') }], { mirrorInRtl: ["gone"] }), /gone/);
});

test("component text that keeps Korean words together is read as it was written", async () => {
  // keepWords() puts an invisible joiner between letters. A component that draws
  // it without readAs() hands the joined text to screen readers and to tests.
  const dir = new URL("../android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/component/", import.meta.url);
  const { readdir } = await import("node:fs/promises");
  for (const name of await readdir(dir)) {
    const source = await readFile(new URL(name, dir), "utf8");
    if (name === "WordsText.kt") {
      assert.match(source, /\.keepWords\(\), modifier\.readAs\(text\)/);
    } else {
      assert.doesNotMatch(source, /\.keepWords\(\)/, `${name} draws keepWords() directly; use WordsText`);
    }
  }
});
