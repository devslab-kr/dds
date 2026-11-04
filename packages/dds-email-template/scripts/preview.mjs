import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fixtures } from "../examples/fixtures.mjs";
import { renderEmail } from "../src/index.mjs";

export const repositoryRoot = fileURLToPath(
  new URL("../../../", import.meta.url),
);
export const defaultOutputDirectory = resolve(
  repositoryRoot,
  "test-results/dds-email-template/previews",
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const escape = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

/** Generate synthetic files only. Never sends mail or substitutes real Auth data. */
export async function generatePreviews({
  outputDirectory = defaultOutputDirectory,
} = {}) {
  await mkdir(outputDirectory, { recursive: true });
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    synthetic: true,
    productionSaved: false,
    actualSendCount: 0,
    rendererSha256: sha256(
      await readFile(new URL("../src/index.mjs", import.meta.url)),
    ),
    fixturesSha256: sha256(
      await readFile(new URL("../examples/fixtures.mjs", import.meta.url)),
    ),
    records: [],
  };
  for (const fixture of fixtures) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fixture.id))
      throw new Error("Preview IDs must be safe filenames.");
    const rendered = renderEmail(fixture.input);
    await writeFile(
      resolve(outputDirectory, `${fixture.id}.html`),
      rendered.html,
      "utf8",
    );
    await writeFile(
      resolve(outputDirectory, `${fixture.id}.txt`),
      rendered.text,
      "utf8",
    );
    manifest.records.push({
      id: fixture.id,
      label: fixture.label,
      html: `${fixture.id}.html`,
      text: `${fixture.id}.txt`,
      inputSha256: sha256(JSON.stringify(fixture.input)),
      htmlSha256: sha256(rendered.html),
      textSha256: sha256(rendered.text),
    });
  }
  // Navigation belongs to the local preview index, never to the email HTML.
  const index = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DDS 이메일 정적 미리보기</title><body style="max-width:900px;margin:32px auto;padding:0 20px;font:16px/1.7 system-ui,sans-serif"><h1>DDS 이메일 정적 미리보기</h1><p>모든 인증번호·이름·주소·날짜와 작업 링크는 가상 예시입니다. 실제 메일 발송과 운영 저장은 수행하지 않습니다.</p><ul>${manifest.records.map((record) => `<li><a href="${record.html}">${escape(record.label)}</a> · <a href="${record.text}">일반 텍스트</a></li>`).join("")}</ul></body></html>`;
  await writeFile(resolve(outputDirectory, "index.html"), index, "utf8");
  await writeFile(
    resolve(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return { outputDirectory, manifest };
}

/** Local-only optional server. Serves generated files; no redirects or proxy. */
export async function startPreviewServer({
  outputDirectory = defaultOutputDirectory,
  port = 0,
} = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Invalid local preview port.");
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }
      const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      const file = pathname === "/" ? "index.html" : pathname.slice(1);
      if (
        file !== basename(file) ||
        !/^(?:index\.html|manifest\.json|[a-z0-9]+(?:-[a-z0-9]+)*\.(?:html|txt))$/.test(
          file,
        )
      ) {
        response.writeHead(404).end();
        return;
      }
      const content = await readFile(resolve(outputDirectory, file));
      response.writeHead(200, {
        "Content-Type": file.endsWith(".html")
          ? "text/html; charset=utf-8"
          : file.endsWith(".json")
            ? "application/json; charset=utf-8"
            : "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolveListening);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Local preview server did not bind TCP.");
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolveClosed, reject) =>
        server.close((error) => (error ? reject(error) : resolveClosed())),
      ),
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = await generatePreviews();
  console.log(
    JSON.stringify({
      outputDirectory: result.outputDirectory,
      fixtures: result.manifest.records.length,
      actualSendCount: 0,
    }),
  );
  if (process.argv.includes("--serve")) {
    const portArgument = process.argv.find((argument) =>
      argument.startsWith("--port="),
    );
    const local = await startPreviewServer({
      outputDirectory: result.outputDirectory,
      port: portArgument ? Number(portArgument.slice(7)) : 0,
    });
    console.log(
      `Local static preview: ${local.origin}/ (no automatic browser opening)`,
    );
    for (const signal of ["SIGINT", "SIGTERM"])
      process.once(signal, () => {
        local.server.close();
      });
  }
}
