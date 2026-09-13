import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("dds-table pins TanStack exactly and ships the worker condition", async () => {
  const manifest = await json("packages/dds-table/package.json");
  assert.equal(manifest.name, "@devslab/dds-table");
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.dependencies["@tanstack/solid-table"], "9.2.4");
  assert.equal(manifest.peerDependencies["solid-js"], "1.9.15");
  assert.equal(manifest.exports["."].worker, "./dist/server.js");
  assert.equal(manifest.exports["."].browser, "./dist/index.js");
  assert.ok(
    Object.keys(manifest.exports["."]).indexOf("worker") < Object.keys(manifest.exports["."]).indexOf("browser"),
    "Worker SSR must win when worker and browser conditions are both active",
  );
});

/** Every rule in a stylesheet as { selectors, body, comment } — the comment
 *  being the block comment written directly above the rule, if any. Media
 *  wrappers are unwrapped so their inner rules are listed too. */
function cssRules(text) {
  const rules = [];
  // The selector group has no braces to stop at, so it swallows the comment
  // above the rule; the comment is recovered from it rather than matched
  // separately.
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, prelude, body] of text.replace(/@media[^{]+\{/g, "").matchAll(ruleRe)) {
    const comments = [...prelude.matchAll(/\/\*[\s\S]*?\*\//g)].map(([comment]) => comment);
    const selectors = prelude.replace(/\/\*[\s\S]*?\*\//g, "").split(",").map((selector) => selector.trim()).filter(Boolean);
    rules.push({ selectors, body, comment: comments.at(-1) ?? "" });
  }
  return rules;
}

const ruleFor = (rules, selector) => rules.find((rule) => rule.selectors.includes(selector));

test("table.css carries the console rules, each with its reason", async () => {
  const rules = cssRules(await read("packages/dds-css/src/table.css"));
  const expectations = [
    [".dds-table code", /font-family:\s*var\(--dds-font-family-mono\)/, /character by character/],
    [".dds-table__actions .dds-btn", /white-space:\s*nowrap/, /~53px/],
    [".dds-table td:has(> .dds-table__actions)", /padding-block:\s*var\(--dds-space-4\)/, null],
    [".dds-table td:has(.dds-btn--sm)", /padding-block:\s*var\(--dds-space-4\)/, /53px row/],
    [".dds-table--dense .dds-btn--sm", /min-block-size:\s*var\(--dds-space-24\)/, /24px/],
    [".dds-table-wrap--tall .dds-table", /border-collapse:\s*separate/, /sticky header from actually sticking/],
  ];
  for (const [selector, declaration, reason] of expectations) {
    const rule = ruleFor(rules, selector);
    assert.ok(rule, `table.css must define ${selector}`);
    assert.match(rule.body, declaration, `${selector} must declare ${declaration}`);
    if (reason) assert.match(rule.comment, reason, `${selector} must say why it exists`);
  }
  assert.match(ruleFor(rules, ".dds-table__actions .dds-btn").body, /min-block-size:\s*var\(--dds-space-32\)/);
  assert.match(ruleFor(rules, ".dds-table--dense .dds-btn--sm").body, /padding-block:\s*0/);
  assert.match(ruleFor(rules, ".dds-table-wrap--tall .dds-table").body, /border-spacing:\s*0/);
});

test("table.css restates the touch floor its button rules out-specify", async () => {
  const text = await read("packages/dds-css/src/table.css");
  const coarse = text.match(/@media \(pointer: coarse\) \{([\s\S]*?)\n\}/);
  assert.ok(coarse, "table.css must carry a coarse-pointer block");
  for (const selector of [".dds-table__actions .dds-btn", ".dds-table--dense .dds-btn--sm", ".dds-table--dense .dds-table__actions .dds-btn"]) {
    assert.ok(coarse[1].includes(selector), `${selector} must be raised back to 44px on touch`);
  }
  assert.match(coarse[1], /min-block-size:\s*44px/);
  // Source order is the cascade here (equal specificity): the dense rule must
  // follow the actions rule, and the coarse block must follow both.
  const actions = text.indexOf(".dds-table__actions .dds-btn {");
  const dense = text.indexOf(".dds-table--dense .dds-btn--sm,");
  assert.ok(actions >= 0 && dense > actions && coarse.index > dense);
});

test("every table.css class that sets display re-declares [hidden]", async () => {
  const rules = cssRules(await read("packages/dds-css/src/table.css"));
  const hidden = new Set(rules.filter((rule) => /display:\s*none/.test(rule.body)).flatMap((rule) => rule.selectors));
  for (const rule of rules) {
    if (!/display:\s*(?!none\b)[a-z]/.test(rule.body)) continue;
    for (const selector of rule.selectors) {
      if (!/^\.[\w-]+$/.test(selector)) continue; // element/descendant rules are not a toggled component root
      assert.ok(hidden.has(`${selector}[hidden]`), `${selector} sets display, so ${selector}[hidden] must restore display: none`);
    }
  }
});

test("dds-table exports the table surface and nothing else", async () => {
  const entry = await read("packages/dds-table/src/index.ts");
  for (const symbol of ["DataTable", "Column", "DataTableLabels"]) {
    assert.match(entry, new RegExp(symbol), `${symbol} must be exported`);
  }

  // Anchored to actual exported identifiers, not a raw substring search:
  // `/Th|Td|useDataTable/` is unanchored and case-sensitive, so it would
  // fail the moment a future comment contained an ordinary word like
  // "This" or "Update" — without weakening the property being guarded
  // (the row/cell primitives stay unexported), which this checks by name
  // rather than by pattern.
  const exportedNames = [...entry.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)]
    .flatMap(([, group]) => group.split(","))
    .map((specifier) => specifier.trim())
    .filter(Boolean)
    .map((specifier) => {
      const aliased = specifier.match(/\bas\s+([A-Za-z0-9_$]+)\s*$/);
      return aliased ? aliased[1] : specifier.split(/\s+/)[0];
    });
  for (const primitive of ["Th", "Td", "useDataTable"]) {
    assert.ok(
      !exportedNames.includes(primitive),
      `${primitive} must stay unexported until a second consumer needs it`,
    );
  }
});
