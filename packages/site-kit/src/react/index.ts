import { createElement as h, type ReactNode } from "react";
import { DEVSLAB_PUBLISHER, devslabCopyright } from "../../src/core/devslab.mjs";

export interface SiteLink { href: string; label: string; emphasis?: boolean }
export interface ProductBrandProps {
  product?: string;
  href?: string;
  logo?: ReactNode;
  markSrc?: string;
  className?: string;
}
export function ProductBrand({ product, href = "/", logo, markSrc = "/brand.svg", className = "" }: ProductBrandProps) {
  const name = [DEVSLAB_PUBLISHER.name, product].filter(Boolean).join(" ");
  return h("a", { href, className: `dds-site-brand ${className}`.trim(), "aria-label": `${name} 홈` },
    h("span", { className: "dds-site-brand__mark", "aria-hidden": true }, logo ?? h("img", { src: markSrc, width: 28, height: 28, alt: "" })),
    h("span", { className: "dds-site-brand__name" }, DEVSLAB_PUBLISHER.name),
    product && h("span", { className: "dds-site-brand__product" }, h("span", { "aria-hidden": true }, "/ "), product),
  );
}
export interface SiteHeaderProps extends ProductBrandProps {
  actions?: ReactNode;
  className?: string;
}
export function SiteHeader({ actions, className = "", ...brand }: SiteHeaderProps) {
  return h("header", { className: `dds-site-header ${className}`.trim() },
    h("div", { className: "dds-site-container dds-site-header__inner" },
      h(ProductBrand, brand),
      actions && h("div", { className: "dds-site-header__actions" }, actions),
    ),
  );
}
export interface SiteFooterProps {
  links?: readonly SiteLink[];
  locale?: string;
  year?: number;
  logo?: ReactNode;
  markSrc?: string;
  showPublisherLink?: boolean;
  extra?: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
  linksLabel?: string;
  className?: string;
}
export function SiteFooter({ links = [], locale = "ko", year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Seoul" }).format(new Date())), logo, markSrc = "/brand.svg", showPublisherLink = true, extra, actions, details, linksLabel = "서비스 정책", className = "" }: SiteFooterProps) {
  const linkItems = links.map((link) => h("li", { key: link.href }, h("a", { href: link.href, className: link.emphasis ? "dds-site-link--emphasis" : undefined }, link.label)));
  return h("footer", { className: `dds-site-footer ${className}`.trim() },
    h("div", { className: "dds-site-container" },
      h("div", { className: "dds-site-footer__row" },
        h("div", { className: "dds-site-footer__brand" },
          h("span", { className: "dds-site-footer__mark", "aria-hidden": true }, logo ?? h("img", { src: markSrc, width: 20, height: 20, alt: "" })),
          h("bdi", null, devslabCopyright({ year, locale })),
          showPublisherLink && h("a", { href: DEVSLAB_PUBLISHER.url }, `by ${DEVSLAB_PUBLISHER.name}`),
        ),
        extra && h("div", { className: "dds-site-footer__extra" }, extra),
        (links.length > 0 || actions) && h("nav", { className: "dds-site-footer__nav", "aria-label": linksLabel },
          links.length > 0 && h("ul", { className: "dds-site-footer__links" }, ...linkItems),
          actions,
        ),
      ),
      details && h("div", { className: "dds-site-footer__details" }, details),
    ),
  );
}
