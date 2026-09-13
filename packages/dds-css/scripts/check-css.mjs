/**
 * dds-css hardcoding guard (backlog P1-2 "토큰 CSS 변수만 참조 — 하드코딩 금지").
 *
 * Mechanical enforcement of spec §1/§3.1: component CSS may not carry its
 * own color values. Bans in src/*.css:
 *   - hex colors (#fff, #06b6d4, 8-digit alpha hex)
 *   - color functions: rgb()/rgba()/hsl()/hsla()/oklch()/color()/color-mix()
 *     (color-mix included — mixing is a semantic-token decision, not a
 *     component decision)
 *   - !important (a component that needs it is fighting its own tokens)
 * Also requires every component file to reference at least one var(--dds-*),
 * and the built dist/dds.css to contain every src file (bundle drift guard).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FILES } from "../build.mjs";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const BANNED = [
  [/#[0-9a-fA-F]{3,8}\b/, "hex color"],
  [/\brgba?\(/, "rgb()/rgba()"],
  [/\bhsla?\(/, "hsl()/hsla()"],
  [/\boklch\(/, "oklch()"],
  [/\bcolor\(/, "color()"],
  [/\bcolor-mix\(/, "color-mix()"],
  [/!important/, "!important"],
];

/**
 * A minimal, generic-enough CSS cascade resolver for the flat, class-only,
 * single-level-of-descendant-combinator selectors this bundle actually
 * uses (no ids, no attribute selectors beyond `:not(.class)`, no nested
 * media inside media). Not a general CSS engine — just enough to answer
 * "which declared value for this property wins on an element with these
 * classes, under this ancestor" by computing real specificity and source
 * order over the actual built bundle, so a future edit to selector order
 * or exclusions is checked against real cascade math, not read by eye.
 */
function classSpecificity(selector) {
  return (selector.match(/\.[a-zA-Z0-9_-]+/g) || []).length;
}

function compoundMatches(compound, classes) {
  const negated = [...compound.matchAll(/:not\(\.([a-zA-Z0-9_-]+)\)/g)].map((m) => m[1]);
  const positive = [...compound.replace(/:not\([^)]*\)/g, "").matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  return positive.every((c) => classes.has(c)) && negated.every((c) => !classes.has(c));
}

/** `selector` may have one descendant-combinator level ("A B"); the last
 *  compound unit is matched against the target element's own classes, any
 *  earlier units against the given ancestor classes. */
function selectorMatchesElement(selector, elementClasses, ancestorClasses) {
  const units = selector.trim().split(/\s+/);
  const own = units[units.length - 1];
  const ancestors = units.slice(0, -1);
  return compoundMatches(own, elementClasses) && ancestors.every((unit) => compoundMatches(unit, ancestorClasses));
}

/** Every declared `property: value;` across the bundle, one entry per
 *  selector in a comma-separated list, carrying that selector's
 *  specificity and its source position (so equal specificity resolves by
 *  order, per the cascade). CSS comments are stripped first — this
 *  package's comments are long and would otherwise be swallowed into the
 *  "selector" of whatever rule follows them, since this resolver has no
 *  real tokenizer. */
function declaredRules(cssText, property) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  let order = 0;
  while ((match = ruleRe.exec(withoutComments))) {
    order += 1;
    const [, selectorList, body] = match;
    const propertyMatch = body.match(new RegExp(`${property}:\\s*([^;]+);`));
    if (!propertyMatch) continue;
    for (const selector of selectorList.split(",")) {
      rules.push({ selector: selector.trim(), value: propertyMatch[1].trim(), specificity: classSpecificity(selector), order });
    }
  }
  return rules;
}

function winningValue(cssText, property, elementClasses, ancestorClasses) {
  let winner;
  for (const rule of declaredRules(cssText, property)) {
    if (!selectorMatchesElement(rule.selector, elementClasses, ancestorClasses)) continue;
    const beatsIncumbent = !winner
      || rule.specificity > winner.specificity
      || (rule.specificity === winner.specificity && rule.order >= winner.order);
    if (beatsIncumbent) winner = rule;
  }
  return winner?.value;
}

function consoleDensityCascadeErrors(bundle) {
  const shell = new Set(["dds-console-shell"]);
  const bodyTwo = "var(--dds-typo-body-2-font-size)";
  const bodyOne = "var(--dds-typo-body-1-font-size)";
  const errors = [];
  const plain = winningValue(bundle, "font-size", new Set(["dds-btn"]), shell);
  if (plain !== bodyTwo) {
    errors.push(`dist/dds.css: a plain .dds-btn inside .dds-console-shell must resolve to body-2 font-size, got ${plain}`);
  }
  const large = winningValue(bundle, "font-size", new Set(["dds-btn", "dds-btn--lg"]), shell);
  if (large !== bodyOne) {
    errors.push(`dist/dds.css: .dds-btn--lg inside .dds-console-shell must keep its own body-1 font-size, got ${large} (the console density rule is defeating the size modifier)`);
  }
  const small = winningValue(bundle, "font-size", new Set(["dds-btn", "dds-btn--sm"]), shell);
  if (small === bodyTwo) {
    errors.push("dist/dds.css: .dds-btn--sm inside .dds-console-shell resolves to the same font-size as a plain .dds-btn — the console density rule is defeating the size modifier");
  }
  return errors;
}

for (const file of FILES) {
  const text = readFileSync(join(pkgDir, "src", file), "utf8");
  text.split("\n").forEach((line, i) => {
    for (const [re, label] of BANNED) {
      if (re.test(line)) errors.push(`src/${file}:${i + 1} contains ${label}: ${line.trim()}`);
    }
  });
  if (file !== "base.css" && !text.includes("var(--dds-")) {
    errors.push(`src/${file} references no --dds-* token variables`);
  }
}

let bundle;
try {
  bundle = readFileSync(join(pkgDir, "dist", "dds.css"), "utf8");
} catch {
  errors.push("dist/dds.css missing — run build before check");
}
if (bundle) {
  for (const file of FILES) {
    const src = readFileSync(join(pkgDir, "src", file), "utf8").trim();
    if (!bundle.includes(src)) errors.push(`dist/dds.css is stale: src/${file} content not in bundle`);
  }
  // Built contract: <a class="dds-btn"> must not carry the UA anchor underline.
  const btnStart = bundle.indexOf(".dds-btn {");
  const btnBlock = btnStart >= 0 ? bundle.slice(btnStart, bundle.indexOf("}", btnStart)) : "";
  if (!/text-decoration:\s*none/.test(btnBlock)) errors.push("dist/dds.css: .dds-btn block lacks text-decoration: none");

  // Built contract: the console density override (console-shell.css) must
  // compose with button.css's size modifiers, not defeat them. This is
  // DDS's first cross-component CSS rule, so it is pinned by actually
  // resolving the cascade — computing selector specificity and source
  // order over the real bundle — rather than by reading the selector text,
  // since a plain string check can't tell "wins" from "loses".
  errors.push(...consoleDensityCascadeErrors(bundle));
}

if (errors.length) {
  console.error(`dds-css check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`dds-css: ${FILES.length} source files clean (no hardcoded colors), bundle in sync`);
