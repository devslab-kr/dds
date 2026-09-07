/* The smallest real consumer: a client entry that renders SiteHeader and
   nothing else. scripts/check-client-bundle.mjs builds it and reads what the
   consumer's bundler kept. */
import { render } from "solid-js/web";
import { SiteHeader } from "@devslab/site-kit/solid";

declare global { interface Window { __props: Parameters<typeof SiteHeader>[0] } }
render(() => <SiteHeader {...window.__props} />, document.body);
