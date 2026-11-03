/**
 * Vendored-copy drift check (companion to check-docs-sync.mjs).
 *
 * D-009 (2026-08-13) had consumers hold committed copies of the build outputs
 * until publishing was settled. D-044 (2026-11-03) retired that model: the
 * packages are on public npm and consumers install them pinned. devslab.kr
 * switched in jlc488/devlab.kr#114 (exact pin, build-time copy from
 * node_modules, Dependabot bumps) and holds no output copy any more, so it is
 * no longer listed here. Its /dds/* showcase pages are still hand-copied from
 * preview/*.html by its own sync-dds-showcase.mjs, but those are pages, not
 * build outputs, and nothing here mirrors them.
 *
 * The check stays for the copies that still exist. When the last entry in
 * CONSUMERS is gone, delete this script and the `check:consumers` entry in
 * package.json with it.
 *
 * Why a detector at all: D-011 (2026-08-15) added bg.inverse / text.on-inverse;
 * both vendored copies of the day sat two tokens behind for two weeks, and the
 * gap was found by hand, not by a check.
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
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "packages", "dds-tokens", "dist");

// Consumers live beside this repo. dds sits at <home>/code/workspace/dds and
// the products at <home>/workspace/<name>.
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

if (drifted > 0) {
  console.error(`\n${drifted} consumer(s) are serving stale tokens. Re-sync and commit there.`);
  process.exit(1);
}
console.log(`\nvendored copies in sync (${checked} file(s) checked, ${skipped} consumer(s) skipped).`);
