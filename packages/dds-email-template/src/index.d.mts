export interface EmailBrand {
  name: string;
  /** JN uses left; qoqo uses center. */
  align?: "left" | "center";
  logo?: { url: string; width: number; height: number; alt: string };
  /** Only #RGB or #RRGGBB. onPrimary defaults to accessible black or white. */
  colors: {
    primary: string;
    onPrimary?: string;
    heading?: string;
    text?: string;
    muted?: string;
    background?: string;
    surface?: string;
    border?: string;
  };
}

export interface EmailContent {
  subject: string;
  title: string;
  preheader?: string;
  introduction?: readonly string[];
  details?: readonly { label: string; value: string }[];
  /** Explicit length, ASCII digits; no code generation or expiry inference. */
  verification?: { code: string; digits: 6 | 8; instruction: string };
  action?: { label: string; url: string };
  safety?: readonly string[];
  footer?: readonly string[];
}

export interface EmailPolicy {
  /** Canonical exact HTTPS origins, without paths, trailing slash or wildcards. */
  allowedActionOrigins: readonly string[];
  /** Required when a logo is present. No implicit asset-origin permission. */
  allowedAssetOrigins?: readonly string[];
}

export interface RenderEmailInput {
  brand: EmailBrand;
  content: EmailContent;
  policy: EmailPolicy;
  /** ASCII language/subtag shape only; caller supplies valid HTML language metadata. Default ko. */
  language?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Messages name only a field and validation rule; never include supplied values. */
export class EmailTemplateError extends TypeError {
  readonly field: string;
  constructor(field: string, reason: string);
}

/** Pure synchronous rendering. Does not fetch, send, log, generate codes or grant authority. */
export function renderEmail(input: RenderEmailInput): RenderedEmail;
