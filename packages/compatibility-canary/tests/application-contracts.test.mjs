import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function source(path) {
  return readFile(resolve(packageRoot, path), "utf8");
}

test("actual TanStack application sources carry every canary contract", async () => {
  const [manifestText, matrixText, rootRoute, indexRoute, serverSource] = await Promise.all([
    source("package.json"),
    source("compatibility-matrix.json"),
    source("src/routes/__root.tsx"),
    source("src/routes/index.tsx"),
    source("src/server-canary.ts"),
  ]);
  const manifest = JSON.parse(manifestText);
  const matrix = JSON.parse(matrixText);

  assert.equal(manifest.dependencies["solid-js"], "2.0.0-rc.3");
  assert.equal(matrix.runtime["solid-js"], "2.0.0-rc.3");

  const head = rootRoute.slice(rootRoute.indexOf("<head>"), rootRoute.indexOf("</head>") + 7);
  assert.match(head, /<HydrationScript\s*\/>/);
  assert.match(head, /<HeadContent\s*\/>/);
  assert.match(rootRoute, /notFoundComponent:[\s\S]*DDS canary route not found/);
  assert.match(rootRoute, /DDS 호환성 카나리/);
  assert.match(rootRoute, /\/canary\.svg/);

  assert.match(indexRoute, /createFileRoute\("\/"\)/);
  assert.match(indexRoute, /useQuery/);
  assert.match(indexRoute, /data-canary-hydrated/);
  assert.match(serverSource, /createServerFn/);
  assert.match(serverSource, /getRequest/);
  assert.match(serverSource, /createCanaryServerFunction/);
  assert.match(serverSource, /ServiceBinding/);
});

test("actual verification entry points generate routes, inspect install output, and scan artifacts", async () => {
  const [manifestText, installGate, previewSmoke, artifactScan, cleanRunner, sentinels] = await Promise.all([
    source("package.json"),
    source("scripts/verify-install.mjs"),
    source("scripts/preview-smoke.mjs"),
    source("scripts/scan-build.mjs"),
    source("scripts/run-clean.mjs"),
    source("scripts/secret-sentinels.mjs"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.match(manifest.scripts.typecheck, /generate:routes/);
  assert.match(manifest.scripts.build, /scan-build/);
  assert.match(manifest.scripts["verify:dependencies"], /verify-install/);
  assert.match(installGate, /strict-peer-dependencies/);
  assert.match(installGate, /assertCleanDiagnostics/);
  assert.match(previewSmoke, /initialHtml/);
  assert.match(previewSmoke, /assertNoLikelySecrets\(initialHtml/);
  assert.match(previewSmoke, /withSecretSentinels/);
  assert.match(artifactScan, /assertNoLikelySecrets/);
  assert.match(artifactScan, /CANARY_SECRET_SENTINELS/);
  assert.match(cleanRunner, /withSecretSentinels/);
  assert.match(sentinels, /DDS_CANARY_SECRET_SENTINEL/);
});
