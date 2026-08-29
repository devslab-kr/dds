import { spawn } from "node:child_process";
import { assertCleanDiagnostics } from "../src/canary-contracts.mjs";

const npmExecPath = process.env.npm_execpath;
const args = ["install", "--frozen-lockfile", "--strict-peer-dependencies", "--force"];
if (process.env.PNPM_CANARY_OFFLINE === "1") args.push("--offline");
const command = npmExecPath ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
const child = spawn(command, commandArgs, { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { const text = chunk.toString(); output += text; process.stderr.write(text); });
const code = await new Promise((resolveExit, reject) => { child.once("error", reject); child.once("exit", (value) => resolveExit(value ?? 1)); });
assertCleanDiagnostics(output);
if (code !== 0) process.exit(code);
