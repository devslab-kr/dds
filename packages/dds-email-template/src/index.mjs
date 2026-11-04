// No runtime imports: this module uses only ECMAScript and the standard URL API.
const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;
const BODY_CONTROLS = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/u;
const LONE_SURROGATE = /\p{Surrogate}/u;
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif";

export class EmailTemplateError extends TypeError {
  /** @param {string} field @param {string} reason */
  constructor(field, reason) {
    super(`Invalid ${field}: ${reason}`);
    this.name = "EmailTemplateError";
    this.field = field;
  }
}

/** @param {string} field @param {string} reason @returns {never} */
function fail(field, reason) {
  throw new EmailTemplateError(field, reason);
}

/** @param {unknown} value @param {string} field @param {readonly string[]} keys */
function object(value, field, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(field, "expected an object");
  if (Object.keys(value).some((key) => !keys.includes(key)))
    fail(field, "unsupported field");
}

/** @param {unknown} value @param {string} field @param {boolean} [singleLine] @param {number} [limit] */
function string(value, field, singleLine = false, limit = 16000) {
  if (typeof value !== "string" || !value.trim() || value.length > limit)
    fail(field, "expected nonblank bounded text");
  if (
    (singleLine ? SINGLE_LINE_CONTROLS : BODY_CONTROLS).test(value) ||
    LONE_SURROGATE.test(value)
  )
    fail(field, "unsupported control character");
  return value;
}

/** @param {readonly string[] | undefined} value @param {string} field */
function paragraphs(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100)
    fail(field, "expected at most 100 text items");
  return Array.from(value, (item) => string(item, field));
}

/** @param {unknown} value @param {string} field */
function color(value, field) {
  if (typeof value !== "string" || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value))
    fail(field, "expected a hex color");
  return value;
}

/** @param {string} value */
function luminance(value) {
  const hex = value.slice(1);
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const rgb = [0, 2, 4].map((index) => {
    const channel = parseInt(full.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

/** @param {string} a @param {string} b */
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** @param {string} value */
function escape(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

/** @param {unknown} value @param {string} field */
function httpsUrl(value, field) {
  const raw = string(value, field, true, 8192);
  if (
    !/^https:\/\//i.test(raw) ||
    /[\s\\]/u.test(raw) ||
    /%(?:0[\da-f]|1[\da-f]|7f|5c)/i.test(raw)
  )
    fail(field, "expected an unambiguous HTTPS URL");
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(field, "expected an absolute HTTPS URL");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    raw.split("/")[2].includes("@")
  )
    fail(field, "credentials or unsupported URL");
  return url;
}

/** @param {readonly string[] | undefined} value @param {string} field */
function origins(value, field) {
  if (!Array.isArray(value) || value.length > 100)
    fail(field, "expected at most 100 exact HTTPS origins");
  return new Set(
    Array.from(value, (entry) => {
      const url = httpsUrl(entry, field);
      if (url.origin !== entry || url.hostname.includes("*"))
        fail(
          field,
          "expected a canonical origin without path, credentials, query or fragment",
        );
      return url.origin;
    }),
  );
}

/** @param {unknown} value @param {string} field @param {Set<string>} allowed */
function permittedUrl(value, field, allowed) {
  const url = httpsUrl(value, field);
  if (!allowed.has(url.origin)) fail(field, "origin is not allowed");
  return url.href;
}

/** @param {unknown} value @param {string} field */
function dimension(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 600
  )
    fail(field, "expected integer pixels from 1 to 600");
  return value;
}

/** @param {import('./index.d.mts').RenderEmailInput} input @returns {import('./index.d.mts').RenderedEmail} */
export function renderEmail(input) {
  object(input, "input", ["brand", "content", "policy", "language"]);
  const { brand, content, policy } = input;
  object(brand, "brand", ["name", "align", "logo", "colors"]);
  object(content, "content", [
    "subject",
    "title",
    "preheader",
    "introduction",
    "details",
    "verification",
    "action",
    "safety",
    "footer",
  ]);
  object(policy, "policy", ["allowedActionOrigins", "allowedAssetOrigins"]);
  object(brand.colors, "brand.colors", [
    "primary",
    "onPrimary",
    "heading",
    "text",
    "muted",
    "background",
    "surface",
    "border",
  ]);
  const name = string(brand.name, "brand.name", true, 200);
  const subject = string(content.subject, "content.subject", true, 200);
  const title = string(content.title, "content.title", false, 1000);
  const preheader =
    content.preheader === undefined
      ? undefined
      : string(content.preheader, "content.preheader", true, 1000);
  const language =
    input.language === undefined
      ? "ko"
      : string(input.language, "language", true, 64);
  if (!/^[a-z]{2,8}(?:-[a-z\d]{1,8})*$/i.test(language))
    fail("language", "expected a language tag");
  const align = brand.align ?? "left";
  if (align !== "left" && align !== "center")
    fail("brand.align", "expected left or center");
  const c = {
    primary: color(brand.colors.primary, "brand.colors.primary"),
    text: color(brand.colors.text ?? "#27272a", "brand.colors.text"),
    heading: color(
      brand.colors.heading ?? brand.colors.text ?? "#18181b",
      "brand.colors.heading",
    ),
    muted: color(brand.colors.muted ?? "#52525b", "brand.colors.muted"),
    background: color(
      brand.colors.background ?? "#f5f6f8",
      "brand.colors.background",
    ),
    surface: color(brand.colors.surface ?? "#ffffff", "brand.colors.surface"),
    border: color(brand.colors.border ?? "#e4e4e7", "brand.colors.border"),
  };
  const onPrimary =
    brand.colors.onPrimary === undefined
      ? contrast(c.primary, "#ffffff") >= contrast(c.primary, "#000000")
        ? "#ffffff"
        : "#000000"
      : color(brand.colors.onPrimary, "brand.colors.onPrimary");
  for (const [field, foreground, background] of [
    ["brand.colors.text", c.text, c.surface],
    ["brand.colors.heading", c.heading, c.surface],
    ["brand.colors.muted", c.muted, c.surface],
    ["brand.colors.text", c.text, c.background],
    ["brand.colors.onPrimary", onPrimary, c.primary],
  ])
    if (contrast(foreground, background) < 4.5)
      fail(field, "text contrast must be at least 4.5:1");

  const actionOrigins = origins(
    policy.allowedActionOrigins,
    "policy.allowedActionOrigins",
  );
  const assetOrigins =
    policy.allowedAssetOrigins === undefined
      ? new Set()
      : origins(policy.allowedAssetOrigins, "policy.allowedAssetOrigins");
  let logo;
  if (brand.logo !== undefined) {
    object(brand.logo, "brand.logo", ["url", "width", "height", "alt"]);
    logo = {
      url: permittedUrl(brand.logo.url, "brand.logo.url", assetOrigins),
      width: dimension(brand.logo.width, "brand.logo.width"),
      height: dimension(brand.logo.height, "brand.logo.height"),
      alt: string(brand.logo.alt, "brand.logo.alt", true, 200),
    };
  }
  const introduction = paragraphs(content.introduction, "content.introduction");
  const safety = paragraphs(content.safety, "content.safety");
  const footer = paragraphs(content.footer, "content.footer");
  if (
    content.details !== undefined &&
    (!Array.isArray(content.details) || content.details.length > 100)
  )
    fail("content.details", "expected at most 100 details");
  const details = Array.from(content.details ?? [], (item) => {
    object(item, "content.details", ["label", "value"]);
    return {
      label: string(item.label, "content.details.label", false, 1000),
      value: string(item.value, "content.details.value"),
    };
  });
  let verification;
  if (content.verification !== undefined) {
    object(content.verification, "content.verification", [
      "code",
      "digits",
      "instruction",
    ]);
    const { code, digits, instruction } = content.verification;
    if (
      (digits !== 6 && digits !== 8) ||
      typeof code !== "string" ||
      !/^[0-9]+$/.test(code) ||
      code.length !== digits
    )
      fail(
        "content.verification",
        "expected an explicit 6 or 8 digit ASCII code",
      );
    verification = {
      code,
      instruction: string(instruction, "content.verification.instruction"),
    };
  }
  let action;
  if (content.action !== undefined) {
    object(content.action, "content.action", ["label", "url"]);
    action = {
      label: string(content.action.label, "content.action.label", false, 1000),
      url: permittedUrl(
        content.action.url,
        "content.action.url",
        actionOrigins,
      ),
    };
  }
  // Keep total output comfortably below common email clipping thresholds.
  const supplied = [
    name,
    subject,
    title,
    preheader ?? "",
    ...introduction,
    ...safety,
    ...footer,
    ...details.flatMap((item) => [item.label, item.value]),
    verification?.instruction ?? "",
    action?.label ?? "",
    action?.url ?? "",
  ];
  if (supplied.join("").length > 24000)
    fail("content", "total content exceeds 24000 characters");

  const wrap =
    "overflow-wrap:anywhere;word-wrap:break-word;word-break:keep-all;";
  const bodyStyle = `margin:0;font-family:${FONT};font-size:16px;line-height:1.75;color:${c.text};${wrap}`;
  /** @param {string} value */
  const lines = (value) => escape(value).replace(/\n/g, "<br>");
  /** @param {string} value @param {string} [extra] */
  const paragraph = (value, extra = "") =>
    `<p style="${bodyStyle}margin:0 0 12px;${extra}">${lines(value)}</p>`;
  /** @param {string} value @param {string} [style] */
  const row = (value, style = "") =>
    `<tr><td style="padding:0 24px 24px;${style}">${value}</td></tr>`;
  const image = logo
    ? `<img src="${escape(logo.url)}" width="${logo.width}" height="${logo.height}" alt="${escape(logo.alt)}" style="display:${align === "center" ? "block" : "inline-block"};border:0;max-width:100%;height:auto;vertical-align:middle;${align === "center" ? "margin:0 auto 12px;" : "margin:0 10px 0 0;"}">`
    : "";
  const header = row(
    `${image}<span style="font-size:19px;line-height:1.5;font-weight:700;color:${c.heading};vertical-align:middle;${wrap}">${escape(name)}</span>`,
    `padding-top:28px;text-align:${align};`,
  );
  const heading = row(
    `<h1 style="margin:0;font-size:24px;line-height:1.4;font-weight:700;color:${c.heading};${wrap}">${lines(title)}</h1><div style="margin-top:20px;border-top:1px solid ${c.border};font-size:0;line-height:0;">&nbsp;</div>`,
  );
  const intro = introduction.length
    ? row(
        introduction.map((text) => paragraph(text)).join(""),
        "padding-bottom:12px;",
      )
    : "";
  const detailRows = details.length
    ? row(
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;">${details.map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${c.border};">${paragraph(item.label, `font-size:13px;font-weight:600;color:${c.muted};margin:0 0 4px;`)}${paragraph(item.value, "margin:0;")}</td></tr>`).join("")}</table>`,
      )
    : "";
  const code = verification
    ? row(
        `<div style="border:1px solid ${c.border};padding:20px 8px;text-align:center;">${paragraph(verification.code, `font-family:'Courier New',monospace;font-size:30px;line-height:1.4;letter-spacing:2px;font-weight:700;color:${c.heading};margin:0;`)}</div>${paragraph(verification.instruction, `font-size:14px;color:${c.muted};margin:12px 0 0;`)}`,
      )
    : "";
  const cta = action
    ? row(
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;"><tr><td align="center" bgcolor="${c.primary}" style="background-color:${c.primary};border-radius:8px;mso-padding-alt:14px 20px;"><a href="${escape(action.url)}" style="display:block;padding:14px 20px;font-size:16px;line-height:1.5;font-weight:700;color:${onPrimary};text-decoration:none;border-radius:8px;${wrap}">${lines(action.label)}</a></td></tr></table>${paragraph(action.url, `font-size:12px;line-height:1.6;color:${c.muted};margin:12px 0 0;`)}`,
      )
    : "";
  const notices = safety.length
    ? row(
        safety
          .map((text) => paragraph(text, `font-size:14px;color:${c.muted};`))
          .join(""),
        `border-top:1px solid ${c.border};padding-top:20px;`,
      )
    : "";
  const foot = footer.length
    ? `<tr><td style="padding:20px 24px 0;color:${c.text};">${footer.map((text) => paragraph(text, `font-size:12px;line-height:1.7;color:${c.text};`)).join("")}</td></tr>`
    : "";
  const html = `<!doctype html>
<html lang="${escape(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:${FONT};">
${preheader ? `<div aria-hidden="true" style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escape(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${c.background}" style="width:100%;background-color:${c.background};"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;table-layout:fixed;"><tr><td bgcolor="${c.surface}" style="background-color:${c.surface};border:1px solid ${c.border};border-radius:12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;table-layout:fixed;${bodyStyle}">${header}${heading}${intro}${detailRows}${code}${cta}${notices}</table>
</td></tr>${foot}</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const text = [
    name,
    title,
    preheader,
    ...introduction,
    ...details.map((item) => `${item.label}: ${item.value}`),
    ...(verification ? [verification.code, verification.instruction] : []),
    ...(action ? [action.label, action.url] : []),
    ...safety,
    ...footer,
  ]
    .filter((value) => value !== undefined)
    .join("\n\n");
  if (new TextEncoder().encode(html).length > 96000)
    fail("content", "rendered HTML exceeds 96000 bytes");
  return { subject, html, text };
}
