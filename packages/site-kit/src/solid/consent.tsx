import { Button, Dialog, Icon, IconButton, Switch } from "@devslab/dds-solid";
import { Show, createSignal, onCleanup, onMount, type JSX } from "solid-js";

import type { ConsentManager, ConsentMessages } from "../core/consent.mjs";

export type { ConsentManager, ConsentMessages };

export interface ConsentBannerProps {
  /** The page's manager from createConsentManager. The banner calls its start(). */
  controller: ConsentManager;
  /** CONSENT_MESSAGES_KO / CONSENT_MESSAGES_EN, or the product's own strings. */
  messages: ConsentMessages;
  /**
   * The bar's "자세히 보기" / "Learn more": the privacy policy's section on analytics and its
   * overseas transfer, with its anchor (`/ko/privacy#analytics`). The bar itself is short, so that
   * section is where the visitor reads Google Analytics, the recipient, the transfer, the retention
   * and how to withdraw. Without a `#fragment` the banner throws RangeError.
   */
  learnMoreHref: string;
  /** The privacy policy page, linked from the settings dialog. */
  privacyHref: string;
}

/** A link with a non-empty `#fragment`: the policy section, not the top of the page. */
const POLICY_SECTION_HREF = /^[^#\s]*#[^#\s]+$/;

/**
 * The consent bar and its settings dialog (D-034).
 *
 * Renders nothing on the server and nothing during hydration: the bar comes
 * in after mount, when the browser's own cookie is known. So it can never
 * disagree with the server's markup, and a page without JavaScript shows no
 * bar and loads no analytics.
 *
 * The bar's three choices are the same button, the same size: "모두 허용",
 * "거부", "설정". Closing it any other way (✕, Escape) is no decision —
 * nothing loads, and the next visit asks again. Its text is short; the
 * disclosure lives in the policy section `learnMoreHref` points at.
 */
export function ConsentBanner(props: ConsentBannerProps) {
  // Checked where the product renders it (on the server too), not left to a
  // link that quietly lands on the top of the policy.
  if (typeof props.learnMoreHref !== "string" || !POLICY_SECTION_HREF.test(props.learnMoreHref)) {
    throw new RangeError(`ConsentBanner: learnMoreHref must link to the privacy policy's analytics section with its #anchor (e.g. /privacy#analytics), got ${JSON.stringify(props.learnMoreHref)}`);
  }
  const [mounted, setMounted] = createSignal(false);
  const [undecided, setUndecided] = createSignal(false);
  const [dismissed, setDismissed] = createSignal(false);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [analytics, setAnalytics] = createSignal(false);
  const [announcement, setAnnouncement] = createSignal("");

  const sync = () => {
    setUndecided(props.controller.needsDecision());
    setDismissed(props.controller.dismissed());
  };
  const openSettings = () => {
    setAnalytics(props.controller.analyticsGranted());
    setSettingsOpen(true);
  };
  onMount(() => {
    const controller = props.controller;
    controller.start();
    sync();
    onCleanup(controller.subscribe((event) => {
      if (event.type === "open-settings") openSettings();
      else sync();
    }));
    setMounted(true);
  });

  // The bar or the button that opened the dialog is gone after a choice; a
  // keyboard user whose focus went with it continues from the page's main
  // content (MarketingShell's <main> takes focus), not from the top of the
  // document. A focus the dialog handed back (the footer button) is left alone.
  const keepFocus = () => setTimeout(() => {
    if (document.activeElement && document.activeElement !== document.body) return;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, 0);
  const decide = (choice: () => unknown) => {
    choice();
    setSettingsOpen(false);
    // Cleared first so saving the same way twice is announced twice.
    setAnnouncement("");
    queueMicrotask(() => setAnnouncement(props.messages.saved));
    keepFocus();
  };
  const acceptAll = () => decide(() => props.controller.acceptAll());
  const rejectAll = () => decide(() => props.controller.rejectAll());
  const dismiss = () => {
    props.controller.dismiss();
    keepFocus();
  };
  const onBarKeyDown: JSX.EventHandler<HTMLElement, KeyboardEvent> = (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    dismiss();
  };
  // While the bar is up the page keeps room for it at the bottom, so the last
  // lines and the footer's links can still be scrolled above it.
  const reserveSpace = (element: HTMLElement) => {
    if (typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--site-consent-block-size", `${element.offsetHeight}px`));
    observer.observe(element);
    onCleanup(() => {
      observer.disconnect();
      root.style.removeProperty("--site-consent-block-size");
    });
  };

  return (
    <Show when={mounted()}>
      <Show when={undecided() && !dismissed()}>
        <section ref={reserveSpace} class="site-consent" aria-label={props.messages.regionLabel} onKeyDown={onBarKeyDown}>
          <div class="site-consent__inner">
            <div class="site-consent__copy">
              <h2 class="site-consent__title">{props.messages.title}</h2>
              <p class="site-consent__body">
                {props.messages.body}{" "}
                <a class="site-consent__link" href={props.learnMoreHref}>{props.messages.learnMore}</a>
              </p>
            </div>
            <div class="site-consent__actions">
              <Button class="site-consent__action" tone="secondary" onClick={acceptAll}>{props.messages.acceptAll}</Button>
              <Button class="site-consent__action" tone="secondary" onClick={rejectAll}>{props.messages.rejectAll}</Button>
              <Button class="site-consent__action" tone="secondary" aria-haspopup="dialog" onClick={openSettings}>{props.messages.settings}</Button>
            </div>
            <IconButton class="site-consent__dismiss" aria-label={props.messages.dismiss} title={props.messages.dismiss} onClick={dismiss}>
              <Icon name="close" size={20} />
            </IconButton>
          </div>
        </section>
      </Show>
      <Dialog
        id="site-consent-settings"
        class="site-consent-dialog"
        open={settingsOpen()}
        onOpenChange={setSettingsOpen}
        title={props.messages.settingsTitle}
        description={props.messages.settingsIntro}
        actions={<>
          <Button class="site-consent__action" tone="secondary" onClick={() => setSettingsOpen(false)}>{props.messages.cancel}</Button>
          <Button class="site-consent__action" tone="secondary" onClick={() => decide(() => props.controller.save({ analytics: analytics() }))}>{props.messages.save}</Button>
        </>}
      >
        <IconButton class="site-consent-dialog__close" aria-label={props.messages.close} title={props.messages.close} onClick={() => setSettingsOpen(false)}>
          <Icon name="close" size={20} />
        </IconButton>
        <ul class="site-consent-categories" role="list">
          <li class="site-consent-category">
            <div class="site-consent-category__copy">
              <h3 class="site-consent-category__title">{props.messages.necessaryTitle}</h3>
              <p class="site-consent-category__body">{props.messages.necessaryBody}</p>
            </div>
            {/* Information, not a control: there is nothing to untick. */}
            <span class="dds-badge site-consent-category__status">{props.messages.necessaryStatus}</span>
          </li>
          <li class="site-consent-category">
            <div class="site-consent-category__copy">
              <h3 class="site-consent-category__title">{props.messages.analyticsTitle}</h3>
              <p id="site-consent-analytics-body" class="site-consent-category__body">{props.messages.analyticsBody}</p>
            </div>
            <Switch
              class="site-consent-category__switch"
              checked={analytics()}
              onCheckedChange={setAnalytics}
              aria-describedby="site-consent-analytics-body"
              label={<span class="dds-sr-only">{props.messages.analyticsSwitch}</span>}
            />
          </li>
        </ul>
        <p class="site-consent-dialog__policy"><a class="site-consent__link" href={props.privacyHref}>{props.messages.privacyLink}</a></p>
      </Dialog>
      <p class="dds-sr-only" role="status">{announcement()}</p>
    </Show>
  );
}

export interface ConsentSettingsButtonProps {
  controller: ConsentManager;
  children: JSX.Element;
  class?: string;
}

/**
 * Re-opens the settings dialog from anywhere — the footer's "쿠키 설정", an
 * account page. The ConsentBanner mounted on the page listens for it; a page
 * without one has nothing to open.
 */
export function ConsentSettingsButton(props: ConsentSettingsButtonProps) {
  return (
    <button
      type="button"
      class={props.class ? `site-consent-trigger ${props.class}` : "site-consent-trigger"}
      aria-haspopup="dialog"
      onClick={() => props.controller.openSettings()}
    >{props.children}</button>
  );
}
