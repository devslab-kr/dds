import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixtures } from "../examples/fixtures.mjs";
import {
  generatePreviews,
  repositoryRoot,
  startPreviewServer,
} from "./preview.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const roundArgument = process.argv.find((argument) =>
  argument.startsWith("--round="),
);
const round = roundArgument ? Number(roundArgument.slice(8)) : 1;
if (round !== 1 && round !== 2)
  throw new Error(
    "Browser verification is bounded to round 1 or correction round 2.",
  );
const outputDirectory = resolve(
  repositoryRoot,
  `test-results/dds-email-template/browser-round-${round}`,
);
await mkdir(outputDirectory, { recursive: true });
const generated = await generatePreviews();
const preview = await startPreviewServer({
  outputDirectory: generated.outputDirectory,
});
const browser = await chromium.launch({ headless: true });
const report = {
  schemaVersion: 1,
  round,
  startedAt: new Date().toISOString(),
  synthetic: true,
  actualSendCount: 0,
  remoteActionNavigations: 0,
  gitSha: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim(),
  sourceState:
    "Working-tree content is identified by the hashes below; HEAD alone does not identify uncommitted changes.",
  rendererSha256: generated.manifest.rendererSha256,
  fixturesSha256: generated.manifest.fixturesSha256,
  previewScriptSha256: sha256(
    await readFile(new URL("./preview.mjs", import.meta.url)),
  ),
  verificationScriptSha256: sha256(
    await readFile(new URL("./verify-browser.mjs", import.meta.url)),
  ),
  previewManifestSha256: sha256(JSON.stringify(generated.manifest)),
  browserVersion: browser.version(),
  scope:
    "Static Chromium rendering only. Does not claim Outlook/client inbox rendering, Auth integration, sending or deployment.",
  records: [],
};

const scenarios = fixtures.flatMap((fixture) =>
  [320, 768, 1280].map((width) => ({ fixture, width, mode: "standard" })),
);
for (const id of ["jn-email-code-8", "qoqo-long-content"]) {
  const fixture = fixtures.find((item) => item.id === id);
  if (fixture) {
    scenarios.push({ fixture, width: 320, mode: "images-blocked" });
    scenarios.push({ fixture, width: 320, mode: "text-200-percent" });
  }
}

function expectedVisibleText(input) {
  const { content } = input;
  return [
    input.brand.name,
    content.title,
    ...(content.introduction ?? []),
    ...(content.details ?? []).flatMap((item) => [item.label, item.value]),
    ...(content.verification
      ? [content.verification.code, content.verification.instruction]
      : []),
    ...(content.action
      ? [content.action.label, new URL(content.action.url).href]
      : []),
    ...(content.safety ?? []),
    ...(content.footer ?? []),
  ];
}

async function verifyScenario({ fixture, width, mode }) {
  const id = `${fixture.id}-${width}-${mode}`;
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const input = fixture.input;
  const allowedLogo = input.brand.logo?.url;
  const intentionalBlocks = [];
  const networkFailures = [];
  const unexpectedRequests = [];
  const pageErrors = [];
  const failedResponses = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!intentionalBlocks.includes(request.url()))
      networkFailures.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown",
      });
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedResponses.push({ url: response.url(), status: response.status() });
  });
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    const localDocument =
      url === `${preview.origin}/${fixture.id}.html` &&
      request.resourceType() === "document";
    if (localDocument) return route.continue();
    if (url === allowedLogo && request.resourceType() === "image") {
      if (mode === "images-blocked") {
        intentionalBlocks.push(url);
        return route.abort("blockedbyclient");
      }
      return route.continue();
    }
    unexpectedRequests.push({ url, resourceType: request.resourceType() });
    return route.abort("blockedbyclient");
  });
  try {
    await page.goto(`${preview.origin}/${fixture.id}.html`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    if (mode === "text-200-percent") {
      // Simulate text enlargement without changing the shipped email or image
      // size. This is distinct from a claim about a mail client's zoom support.
      await page.evaluate(() => {
        const values = [
          ...document.querySelectorAll("body,table,td,span,p,h1,a"),
        ].map((element) => {
          const style = getComputedStyle(element);
          return [
            element,
            parseFloat(style.fontSize),
            parseFloat(style.lineHeight),
          ];
        });
        for (const [element, fontSize, lineHeight] of values) {
          element.style.setProperty("font-size", `${fontSize * 2}px`);
          if (Number.isFinite(lineHeight))
            element.style.setProperty("line-height", `${lineHeight * 2}px`);
        }
      });
    }
    const checks = await page.evaluate(
      ({ expected, input, imageBlocked }) => {
        const normalize = (value) => value.replace(/\s+/gu, " ").trim();
        const visible = normalize(document.body.innerText);
        const links = [...document.querySelectorAll("a")].map((link) => ({
          href: link.href,
          text: link.textContent,
          height: link.getBoundingClientRect().height,
        }));
        const images = [...document.images].map((image) => {
          const box = image.getBoundingClientRect();
          return {
            src: image.src,
            alt: image.alt,
            complete: image.complete,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            width: box.width,
            height: box.height,
          };
        });
        const missingTextIndexes = expected.flatMap((value, index) =>
          visible.includes(normalize(value)) ? [] : [index],
        );
        const tables = [...document.querySelectorAll("table")];
        const doc = document.documentElement;
        const image = images[0];
        const expectedLogo = input.brand.logo;
        const imagePass = expectedLogo
          ? images.length === 1 &&
            image.src === expectedLogo.url &&
            image.alt === expectedLogo.alt &&
            (imageBlocked
              ? image.naturalWidth === 0
              : image.complete &&
                image.naturalWidth > 0 &&
                image.naturalHeight > 0 &&
                Math.abs(
                  image.width / image.height -
                    image.naturalWidth / image.naturalHeight,
                ) < 0.02 &&
                Math.abs(
                  image.naturalWidth / image.naturalHeight -
                    expectedLogo.width / expectedLogo.height,
                ) < 0.02)
          : images.length === 0;
        const expectedAction = input.content.action;
        const linkPass = expectedAction
          ? links.length === 1 &&
            links[0].href === new URL(expectedAction.url).href &&
            normalize(links[0].text) === normalize(expectedAction.label)
          : links.length === 0;
        return {
          overflow: doc.scrollWidth > doc.clientWidth + 1,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          allVisibleText: missingTextIndexes.length === 0,
          missingTextIndexes,
          subject: document.title === input.content.subject,
          titleAndName:
            document.querySelectorAll("h1").length === 1 &&
            normalize(document.querySelector("h1").textContent) ===
              normalize(input.content.title) &&
            visible.includes(normalize(input.brand.name)),
          preheader:
            !input.content.preheader ||
            [...document.querySelectorAll('[aria-hidden="true"]')].some(
              (element) => element.textContent === input.content.preheader,
            ),
          presentationTables:
            tables.length > 0 &&
            tables.every(
              (table) => table.getAttribute("role") === "presentation",
            ),
          usefulImageAlt: images.every((item) => item.alt.trim().length > 0),
          imagePass,
          images,
          linkPass,
          links,
          minimumTargetHeight: links.every((link) => link.height >= 44),
          noInjectedElements:
            document.querySelectorAll(
              "script:not([data-playwright-axe]),iframe,form,svg",
            ).length === 0,
        };
      },
      {
        expected: expectedVisibleText(input),
        input,
        imageBlocked: mode === "images-blocked",
      },
    );
    let keyboard = { applicable: false, pass: true };
    if (input.content.action) {
      await page.keyboard.press("Tab");
      keyboard = await page.evaluate(() => {
        const active = document.activeElement;
        const style = getComputedStyle(active);
        return {
          applicable: true,
          pass:
            active.tagName === "A" &&
            active.matches(":focus-visible") &&
            style.outlineStyle !== "none" &&
            parseFloat(style.outlineWidth) > 0,
          focusedTag: active.tagName,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const screenshot = resolve(outputDirectory, `${id}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    const axeViolations = axe.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      targets: violation.nodes.map((node) => node.target),
    }));
    const booleans = [
      "allVisibleText",
      "subject",
      "titleAndName",
      "preheader",
      "presentationTables",
      "usefulImageAlt",
      "imagePass",
      "linkPass",
      "minimumTargetHeight",
      "noInjectedElements",
    ];
    const pass =
      !checks.overflow &&
      booleans.every((key) => checks[key]) &&
      keyboard.pass &&
      !axeViolations.length &&
      !networkFailures.length &&
      !failedResponses.length &&
      !unexpectedRequests.length &&
      !pageErrors.length;
    return {
      id,
      fixture: fixture.id,
      width,
      mode,
      pass,
      htmlSha256: generated.manifest.records.find(
        (record) => record.id === fixture.id,
      ).htmlSha256,
      checks,
      keyboard,
      axeViolations,
      networkFailures,
      failedResponses,
      intentionalBlocks: intentionalBlocks.length,
      unexpectedRequests,
      pageErrors,
      screenshot,
    };
  } catch (error) {
    return {
      id,
      fixture: fixture.id,
      width,
      mode,
      pass: false,
      error: error.message,
      networkFailures,
      failedResponses,
      unexpectedRequests,
      pageErrors,
    };
  } finally {
    await context.close();
  }
}

try {
  // A single bounded batch with at most three pages at a time.
  for (let offset = 0; offset < scenarios.length; offset += 3) {
    report.records.push(
      ...(await Promise.all(
        scenarios.slice(offset, offset + 3).map(verifyScenario),
      )),
    );
  }
} finally {
  await browser.close();
  await preview.close();
  report.finishedAt = new Date().toISOString();
  report.summary = {
    total: report.records.length,
    passed: report.records.filter((record) => record.pass).length,
    failed: report.records.filter((record) => !record.pass).length,
  };
  report.sourceUnchangedDuringBatch =
    report.rendererSha256 ===
      sha256(await readFile(new URL("../src/index.mjs", import.meta.url))) &&
    report.fixturesSha256 ===
      sha256(
        await readFile(new URL("../examples/fixtures.mjs", import.meta.url)),
      ) &&
    report.previewScriptSha256 ===
      sha256(await readFile(new URL("./preview.mjs", import.meta.url))) &&
    report.verificationScriptSha256 ===
      sha256(await readFile(new URL("./verify-browser.mjs", import.meta.url)));
  report.pass =
    report.summary.failed === 0 && report.sourceUnchangedDuringBatch;
  await writeFile(
    resolve(outputDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
console.log(
  JSON.stringify({
    report: resolve(outputDirectory, "report.json"),
    ...report.summary,
    sourceUnchangedDuringBatch: report.sourceUnchangedDuringBatch,
    actualSendCount: 0,
  }),
);
if (!report.pass) process.exitCode = 1;
