import axe from "axe-core";
import { render } from "@solidjs/web";
import { afterEach, expect, it } from "vitest";

import { Button, Checkbox, Field, Select, Switch } from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

it("common form primitives have no detectable axe violations", async () => {
  const host = document.body.appendChild(document.createElement("main"));
  dispose = render(() => <>
    <Button>Save</Button>
    <Field label="Country" helpText="Choose one">{(control) => <Select {...control}><option>Korea</option></Select>}</Field>
    <Checkbox label="Accept terms" />
    <Switch label="Notifications" />
  </>, host);
  const result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
});
