import { copyFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const syntax = spawnSync(
  process.execPath,
  ["--check", fileURLToPath(new URL("src/index.mjs", root))],
  { stdio: "inherit" },
);
if (syntax.status !== 0) process.exit(syntax.status ?? 1);
await mkdir(new URL("dist/", root), { recursive: true });
await Promise.all(
  ["index.mjs", "index.d.mts"].map((file) =>
    copyFile(new URL(`src/${file}`, root), new URL(`dist/${file}`, root)),
  ),
);
await copyFile(new URL("../../LICENSE", root), new URL("LICENSE", root));
console.log("Built framework-free email renderer and declarations.");
