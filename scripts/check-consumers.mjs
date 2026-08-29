/**
 * Vendored-copy drift check (companion to check-docs-sync.mjs).
 *
 * D-009 says consumers hold committed copies of the build outputs until the
 * publishing question is settled. That decision has no expiry and, until now,
 * no detector: when tokens change here, nothing tells anyone that asklinq and
 * devslab.kr are still serving the old values.
 *
 * It went wrong exactly once already. D-011 (2026-08-15) added
 * bg.inverse / text.on-inverse; both vendored copies sat two tokens behind for
 * two weeks, and the gap was found by hand, not by a check.
 *
 * So: after `pnpm run build`, compare every known vendored file against the
 * dist it mirrors and say plainly which consumer needs a re-sync.
 *
 * Deliberately local-only. The consumer repos are separate checkouts that CI
 * does not have, so a missing repo is SKIPPED, never failed — you cannot diff
 * against something you do not have, and a check that cries wolf in CI gets
 * disabled. It runs where drift is actually created: on the machine of whoever
 * just changed a token.
 *
 * Comparison ignores line endings. The consumers are on Windows with
 * core.autocrlf, so CRLF-vs-LF is noise here, not drift.
 *
 *   node scripts/check-consumers.mjs
 *   DDS_CONSUMER_ROOT=<dir containing the consumer repos> node scripts/check-consumers.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "packages", "dds-tokens", "dist");

// Consumers live beside this repo. dds sits at <home>/code/workspace/dds and
// the products at <home>/workspace/<name>, which is what the consumers' own
// sync scripts already assume (devslab: scripts/sync-dds-tokens.mjs).
const consumerRoot = process.env.DDS_CONSUMER_ROOT
  ? resolve(process.env.DDS_CONSUMER_ROOT)
  : resolve(root, "..", "..", "..", "workspace");

/** @type {{repo: string, resync: string, files: {vendored: string, source: string}[]}[]} */
const CONSUMERS = [
  {
    repo: "asklinq",
    resync: "cp <dds>/packages/dds-tokens/dist/tokens.ts apps/api/src/dds/tokens.ts",
    files: [{ vendored: "apps/api/src/dds/tokens.ts", source: "tokens.ts" }],
  },
  {
    repo: "devslab",
    resync: "node scripts/sync-dds-tokens.mjs",
    files: [
      { vendored: "src/styles/dds/tokens.css", source: "tokens.css" },
      { vendored: "src/styles/dds/preset.cjs", source: join("tailwind", "preset.cjs") },
    ],
  },
];

const normalise = (s) => s.replace(/\r\n/g, "\n").replace(/\s+$/, "");
const read = (p) => normalise(readFileSync(p, "utf8"));

if (!existsSync(dist)) {
  console.error("✗ packages/dds-tokens/dist is missing — run `pnpm run build` first.");
  process.exit(1);
}

let drifted = 0;
let skipped = 0;
let checked = 0;

for (const consumer of CONSUMERS) {
  const repoDir = join(consumerRoot, consumer.repo);
  if (!existsSync(repoDir)) {
    console.log(`- ${consumer.repo}: not checked out here, skipped`);
    skipped++;
    continue;
  }

  const stale = [];
  for (const file of consumer.files) {
    const vendoredPath = join(repoDir, file.vendored);
    const sourcePath = join(dist, file.source);
    if (!existsSync(vendoredPath)) {
      stale.push(`${file.vendored} (missing)`);
      continue;
    }
    checked++;
    if (read(vendoredPath) !== read(sourcePath)) stale.push(file.vendored);
  }

  if (stale.length === 0) {
    console.log(`✓ ${consumer.repo}: vendored copies match dist`);
  } else {
    drifted++;
    console.error(`✗ ${consumer.repo}: ${stale.length} file(s) behind dist`);
    for (const f of stale) console.error(`    ${f}`);
    console.error(`    re-sync: (in ${consumer.repo}) ${consumer.resync}`);
  }
}

// palette.json is derived rather than copied, so compare the parsed value.
const devslabPalette = join(consumerRoot, "devslab", "src", "styles", "dds", "palette.json");
if (existsSync(devslabPalette)) {
  const { default: tokens } = await import(pathToFileURL(join(dist, "tokens.js")).href);
  checked++;
  if (JSON.stringify(JSON.parse(readFileSync(devslabPalette, "utf8"))) !== JSON.stringify(tokens.palette)) {
    drifted++;
    console.error("✗ devslab: src/styles/dds/palette.json differs from dist palette");
    console.error("    re-sync: (in devslab) node scripts/sync-dds-tokens.mjs");
  }
}

if (drifted > 0) {
  console.error(`\n${drifted} consumer(s) are serving stale tokens. Re-sync and commit there.`);
  process.exit(1);
}
console.log(`\nvendored copies in sync (${checked} file(s) checked, ${skipped} consumer(s) skipped).`);
