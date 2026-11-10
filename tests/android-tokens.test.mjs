import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
    const committed = await readFile(new URL(path, root), "utf8").catch(() => null);
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
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
