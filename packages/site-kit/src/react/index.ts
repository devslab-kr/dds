/**
 * `@devslab/site-kit/react` — the marketing chrome for React and Next.js
 * products, the same design as `@devslab/site-kit/solid` (D-045).
 *
 * The published file starts with "use client": the header, the menus and the
 * theme toggle hold state, so a Next.js Server Component renders them as
 * client components and can pass them plain data and server-rendered children.
 * A function prop (`hrefForLocale`, `onLocaleChange`) can only come from a
 * Client Component; from a Server Component pass `hrefs`, built with
 * `localeHrefs` from `@devslab/site-kit`, and a registry's `{ LOCALES }`
 * rather than the registry (its methods cannot cross either).
 *
 * Only components and types are exported here, on purpose: anything exported
 * from a "use client" module is a client reference on the server, so a helper
 * placed here could be rendered by a Server Component but never called.
 *
 * Not here yet, by decision: ConsentBanner (it needs a dialog with a focus
 * trap — a behaviour, not markup — and this entry does not depend on
 * `@devslab/dds-react`) and RequestAccessForm. ConsentSettingsButton is here,
 * so a footer can already carry the "쿠키 설정" entry.
 */
export { LocaleMenu, type LocaleMenuProps, type LocaleMenuVariant } from "./locale-menu";
export { SiteFooter, SiteHeader, ThemeToggle, type SiteFooterProps, type SiteHeaderProps, type ThemeToggleProps } from "./chrome";
export { ErrorLayout, LegalLayout, MarketingShell, NotFoundLayout, StatusBanner, type ErrorLayoutProps, type LegalLayoutProps, type MarketingShellProps, type NotFoundLayoutProps, type StatusBannerProps } from "./layouts";
export { OssProductMark, type OssProductMarkProps } from "./oss-product-mark";
export { SectionBlock, SectionHead, HeroSplit, StepFlow, FeatureRows, PricingNote, type SectionBlockProps, type SectionHeadProps, type HeroSplitProps, type StepFlowProps, type StepFlowStep, type FeatureRow, type FeatureRowsProps, type PricingNoteProps } from "./sections";
export { ConsentSettingsButton, type ConsentSettingsButtonProps } from "./consent";
export type { LocaleList, LocaleState, SiteBrand, SiteLink, SiteMessages, ThemePreference } from "./types";
