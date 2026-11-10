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
  { name: "hex color literal", pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/g },
  // The short forms Android XML also accepts (#RGB, #ARGB), where a value can sit.
  { name: "hex color literal", pattern: /(?<=[>"'])#(?:[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?=[<"'])/g, only: /\.xml$/ },
  // \s spans newlines: `Color(` and `0x…` on separate lines is the same literal.
  { name: "Color(0x…) literal", pattern: /\bColor\s*\(\s*0x/g },
  { name: "ARGB integer literal", pattern: /\b0x[0-9a-fA-F]{8}\b(?:\.toInt\(\))?/g, only: /\.kts?$/ },
];

/** Blank out comments (keeping every newline) so prose may mention a color and line numbers stay true. */
function withoutComments(text, file) {
  const blank = (match) => match.replace(/[^\n]/g, " ");
  return /\.xml$/.test(file)
    ? text.replace(/<!--[\s\S]*?-->/g, blank)
    : text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/\/\/[^\n]*/g, blank);
}

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
    const text = withoutComments(readFileSync(file, "utf8"), file);
    const seen = new Set();
    for (const rule of RULES) {
      if (rule.only && !rule.only.test(file)) continue;
      for (const match of text.matchAll(rule.pattern)) {
        const line = text.slice(0, match.index).split("\n").length;
        if (seen.has(line)) continue;
        seen.add(line);
        violations.push(`android/${rel}:${line}: ${rule.name} — use a generated token instead`);
      }
    }
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
