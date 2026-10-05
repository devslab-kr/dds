/* The page tests/browser/site-kit-consent.spec.ts drives: the real ConsentBanner
   and SiteFooter from dist/, the real manager from src/core, records POSTed to
   a same-origin endpoint the test intercepts. Nothing here reaches a network:
   the test serves https://site.test/ and answers every Google URL itself. */
import { render } from "solid-js/web";
import { ConsentBanner, SiteFooter } from "@devslab/site-kit/solid";
import { CONSENT_MESSAGES_EN, CONSENT_MESSAGES_KO, createConsentManager, postConsentRecord } from "@devslab/site-kit";

const korean = document.documentElement.lang === "ko";
const consentMessages = korean ? CONSENT_MESSAGES_KO : CONSENT_MESSAGES_EN;
const siteMessages = {
  navigationLabel: "Menu", localeLabel: "Language", themeLabel: "Theme", themeSystem: "System", themeLight: "Light",
  themeDark: "Dark", menuOpen: "Menu", menuClose: "Close", footerLabel: "Footer", skipToContent: "Skip to content",
  updatedLabel: "Updated", notFoundTitle: "Not found", notFoundDescription: "Not found", backHome: "Home",
  errorTitle: "Error", errorDescription: "Try again", retry: "Retry",
};

const consent = createConsentManager({
  policyVersion: document.documentElement.dataset.policy ?? "2026-10-05",
  gtm: "GTM-AB12CD3",
  measurementIds: ["G-ABC123"],
  onChange: postConsentRecord("/api/consent"),
});
(window as unknown as { __consent: typeof consent }).__consent = consent;

render(() => <>
  <ConsentBanner controller={consent} messages={consentMessages} privacyHref="/privacy" />
  <div class="site-shell">
    <main id="main-content" class="site-main" tabIndex={-1}>
      <h1>{korean ? "문서에서 답을 찾는 AI 에이전트" : "An AI agent that answers from your documents"}</h1>
      <p><a href="/docs">{korean ? "문서 보기" : "Read the docs"}</a></p>
      {/* Long enough to scroll, so the test can check the page end clears the bar. */}
      {Array.from({ length: 24 }, (_, index) => <p>{korean ? `문단 ${index + 1}` : `Paragraph ${index + 1}`}</p>)}
    </main>
    <SiteFooter
      brand={{ name: "AskLinq", href: "/" }}
      links={[{ href: "/terms", label: korean ? "이용약관" : "Terms" }, { href: "/privacy", label: korean ? "개인정보처리방침" : "Privacy", emphasis: true }]}
      copyright="© DevsLab"
      messages={siteMessages}
      consentSettings={{ controller: consent, label: consentMessages.trigger }}
    />
  </div>
</>, document.body);
