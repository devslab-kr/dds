/* The other end: every export imported and kept alive, so the gate can tell
   "the unused components were dropped" from "nothing is ever dropped". */
import { render } from "solid-js/web";
import * as kit from "@devslab/site-kit/solid";

declare global { interface Window { __kit: typeof kit; __props: Parameters<typeof kit.SiteHeader>[0] } }
window.__kit = kit;
render(() => <kit.SiteHeader {...window.__props} />, document.body);
