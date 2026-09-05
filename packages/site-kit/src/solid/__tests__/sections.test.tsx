import { readFileSync } from "node:fs";
import { render } from "solid-js/web";
import { afterEach } from "vitest";

import * as kit from "../index";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

function mount(node: () => any) {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(node, host);
  return host;
}

const SECTIONS_CSS = readFileSync(new URL("../../../site-sections.css", import.meta.url), "utf8");
