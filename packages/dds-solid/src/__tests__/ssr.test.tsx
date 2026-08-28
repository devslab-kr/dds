import { hydrate, renderToString } from "@solidjs/web";
import { expect, it, vi } from "vitest";

import { Button, Icon } from "../index";

it("renders and hydrates the public primitives without warnings", async () => {
  const html = renderToString(() => <div><Button>Hydrate</Button><Icon name="check" label="Complete" /></div>);
  expect(html).toContain("Hydrate");
  expect(html).toContain("aria-label=\"Complete\"");
  const host = document.body.appendChild(document.createElement("div"));
  host.innerHTML = html;
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const dispose = hydrate(() => <div><Button>Hydrate</Button><Icon name="check" label="Complete" /></div>, host);
  await Promise.resolve();
  expect(warning).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  dispose();
  host.remove();
});
