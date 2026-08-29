import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { assertCleanDiagnostics } from "../src/canary-contracts.mjs";
import { withSecretSentinels } from "./secret-sentinels.mjs";

const [binary, ...args] = process.argv.slice(2);
if (!binary) throw new Error("usage: run-clean.mjs <binary> [...args]");

const executable = resolve("node_modules", ".bin", process.platform === "win32" ? `${binary}.cmd` : binary);
const child = spawn(executable, args, {
  cwd: process.cwd(),
  env: withSecretSentinels(process.env),
  shell: process.platform === "win32",
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    output += text;
    process.stderr.write(text);
  });
}

const exitCode = await new Promise((resolveExit, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolveExit(code ?? 1));
});

assertCleanDiagnostics(output);
if (exitCode !== 0) process.exit(exitCode);
