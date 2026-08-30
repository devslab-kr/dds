import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import { OssProductMark } from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

it("labels an identifying OSS mark and keeps its versioned source URL", () => {
  const host = document.body.appendChild(document.createElement("div"));
  const src = "https://raw.githubusercontent.com/devslab-kr/oss-brand/v0.2.0/dist/numkey/glyph-color.svg";
  dispose = render(() => <OssProductMark name="numkey" src={src} size="sm" />, host);
  const image = host.querySelector("img");
  expect(image?.alt).toBe("numkey");
  expect(image?.getAttribute("src")).toBe(src);
  expect(image?.className).toContain("oss-product-mark--sm");
  expect(image?.getAttribute("decoding")).toBe("async");
});

it("removes duplicate semantics when the mark is decorative", () => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <OssProductMark name="locale-match" src="/locale-match.svg" decorative />, host);
  const image = host.querySelector("img");
  expect(image?.alt).toBe("");
  expect(image?.getAttribute("aria-hidden")).toBe("true");
});
