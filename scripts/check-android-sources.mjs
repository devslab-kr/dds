/**
 * Android source check — no hand-copied colors (the Android counterpart of
 * packages/dds-css/scripts/check-css.mjs).
 *
 * Every color in android/ must come from the generated token files. A hex
 * literal or a `Color(0x…)` anywhere else is a value somebody typed, which is
 * exactly how three apps ended up with three different cyans.
 *
 *   node scripts/check-android-sources.mjs [dir]   (dir defaults to android/)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The only places a color literal may live: the generator's output. */
const GENERATED = ["dds-tokens/src/main/kotlin/", "dds-tokens/src/main/res/values/dds_tokens.xml", "dds-tokens/src/main/res/values-night/dds_tokens.xml"];
const SKIP_DIRS = new Set(["build", ".gradle", ".kotlin", ".idea", "node_modules"]);
const RULES = [
  { name: "hex color literal", pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/ },
  { name: "Color(0x…) literal", pattern: /\bColor\s*\(\s*0x/ },
];

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) yield* sourceFiles(path);
    } else if (/\.(?:kt|kts|xml)$/.test(entry)) {
      yield path;
    }
  }
}

/** @returns {string[]} one "file:line: message" per violation */
export function checkAndroidSources(androidDir = join(root, "android")) {
  const violations = [];
  for (const file of sourceFiles(androidDir)) {
    const rel = relative(androidDir, file).split(sep).join("/");
    if (GENERATED.some((prefix) => rel.startsWith(prefix))) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const rule of RULES) {
          if (rule.pattern.test(line)) violations.push(`android/${rel}:${i + 1}: ${rule.name} — use a generated token instead`);
        }
      });
  }
  return violations;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = checkAndroidSources(process.argv[2] ? join(process.cwd(), process.argv[2]) : undefined);
  if (violations.length > 0) {
    console.error(`android sources: ${violations.length} hand-written color(s)\n${violations.map((v) => `  ${v}`).join("\n")}`);
    process.exit(1);
  }
  console.log("android sources: no hand-written colors");
}
