import type { ReactNode } from "react";

import type { ConsentManager, ConsentMessages } from "@devslab/site-kit";

export type { ConsentManager, ConsentMessages };

export interface ConsentSettingsButtonProps {
  controller: ConsentManager;
  children: ReactNode;
  className?: string;
}

/**
 * Re-opens the consent settings from anywhere — the footer's "쿠키 설정", an
 * account page (D-034). Same markup as the Solid button. The settings
 * dialog listens on the same controller.
 */
export function ConsentSettingsButton(props: ConsentSettingsButtonProps) {
  return (
    <button
      type="button"
      className={props.className ? `site-consent-trigger ${props.className}` : "site-consent-trigger"}
      aria-haspopup="dialog"
      onClick={() => props.controller.openSettings()}
    >{props.children}</button>
  );
}
