/* The smallest real React consumer: a client entry that hydrates SiteHeader
   and nothing else. scripts/check-react-client-bundle.mjs builds it the way a
   browser bundler would and reads what it kept. */
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { SiteHeader } from "@devslab/site-kit/react";

hydrateRoot(document.body, createElement(SiteHeader, window.__props));
