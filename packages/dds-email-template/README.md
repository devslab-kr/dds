# @devslab-kr/dds-email-template

One brand-configurable transactional email renderer. Returns a subject, inline-CSS HTML with presentation tables, and equivalent plain text. Framework-free ESM; zero runtime/peer dependencies. Works in Node 20+ and Cloudflare Workers. It never fetches assets, sends mail, logs content, generates codes, validates an authentication challenge, or grants business authority.

## Install the exact release

Use the existing GitHub Packages registry for this scope. Public npm is not the publication target.

```ini
@devslab-kr:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

The line above is a literal environment-variable reference, never a token value. Supply a dedicated `read:packages` credential through your build secret store; do not copy a broad local `gh` token into an app host. Commit the consumer lockfile, never the credential.

```sh
npm install --save-exact @devslab-kr/dds-email-template@0.1.0
# or
pnpm add --save-exact @devslab-kr/dds-email-template@0.1.0
```

## Render with service-owned content

```ts
import { renderEmail, type EmailBrand } from "@devslab-kr/dds-email-template";

const jn: EmailBrand = {
  name: "정산나우",
  align: "left",
  logo: {
    url: "https://jeongsan.now/brand/jeongsan-symbol.png",
    width: 32,
    height: 32,
    alt: "JN",
  },
  colors: {
    primary: "#06b6d4",
    onPrimary: "#083344",
    heading: "#18181b",
    text: "#52525b",
    muted: "#71717a",
    background: "#f5f6f8",
    surface: "#ffffff",
    border: "#e4e4e7",
  },
};

// These are example-only values, not a real code or validity promise.
const email = renderEmail({
  brand: jn,
  language: "ko",
  content: {
    subject: "[미리보기] 이메일 확인",
    title: "이메일 인증번호를 확인해 주세요",
    introduction: ["인증을 시작한 화면에 아래 번호를 입력해 주세요."],
    verification: {
      code: "00000000",
      digits: 8,
      instruction: "요청한 화면에 안내된 유효 시간 안에 입력해 주세요.",
    },
    safety: ["직접 요청하지 않았다면 이 메일을 무시하셔도 됩니다."],
    footer: ["정적 미리보기 전용입니다."],
  },
  policy: {
    allowedActionOrigins: [],
    allowedAssetOrigins: ["https://jeongsan.now"],
  },
});
// email.subject, email.html, email.text -> your existing mail adapter.
```

For qoqo, change configuration, not template source:

```ts
const qoqo: EmailBrand = {
  name: "코코",
  align: "center",
  logo: {
    url: "https://img.qoqo.menu/brand/qoqo-email-24e7d7f70eadae7fb50f93f860c63ef47a33c7fb147512b85280f2a984b740e4.png",
    width: 184,
    height: 68,
    alt: "qoqo",
  },
  colors: {
    primary: "#2755e9",
    onPrimary: "#ffffff",
    heading: "#181d2a",
    text: "#424c5c",
    muted: "#596273",
    background: "#f7f9fc",
    surface: "#ffffff",
    border: "#e3e7ef",
  },
};
// Its logo policy needs allowedAssetOrigins: ['https://img.qoqo.menu'].
```

The same named import works in a Worker module. Neither `nodejs_compat` nor React is required. For CommonJS applications use `await import(...)`.

## Content contract

Required: `brand.name`, `brand.colors.primary`, `content.subject`, `content.title`, and `policy.allowedActionOrigins` (an empty array is valid for code-only mail).

Optional content, in reading order:

- `preheader`: inbox summary, hidden in HTML but retained in plain text.
- `introduction: string[]`: paragraphs.
- `details: {label: string, value: string}[]`: real supplied business details.
- `verification: {code: string, digits: 6 | 8, instruction: string}`: exact ASCII numeric string; leading zeroes survive. No default code length. JN email is currently eight digits; qoqo invitation-email codes are six. Phone OTP policy is separate.
- `action: {label: string, url: string}`: optional HTTPS action, with a visible URL fallback and the same URL in text. A code and action can coexist only when the consumer purpose calls for both.
- `safety: string[]` and `footer: string[]`: caller-owned notices. No default expiration, support address, permission or success claim.

Optional branding: logo, alignment (`left` default or `center`) and hex colors. `onPrimary` defaults to whichever of black/white gives greater contrast. Explicit text colors must meet 4.5:1 against their rendered backgrounds. Footer uses the existing body color for contrast on the outer background. Layout is one shared 600px maximum frame; there are no service-specific HTML branches. Default language is `ko`; the optional tag changes HTML language metadata, not the supplied content. The caller supplies a valid tag such as `ko` or `en-US`: validation checks only a 2–8 ASCII-letter primary part and 1–8 alphanumeric subtags, not full BCP 47 validity or registry membership; private-use-only tags are unsupported.

## Trust boundaries

All supplied text is escaped in HTML and retained as text in the plain-text output. No raw HTML, CSS, headers or script customization is accepted. Unknown object fields are errors. Subject and single-line metadata reject CR/LF, C0/C1 controls and Unicode line separators. Body text supports LF; other controls including TAB/CR are rejected. Normalize external CRLF to LF in the consumer if required.

Only `#RGB` and `#RRGGBB` colors are accepted. URLs must be absolute HTTPS, without credentials, raw whitespace, controls or backslashes; percent-encoded ASCII controls/backslashes are also rejected. Action and asset origins have independent, fail-closed allowlists. Supply canonical exact origins such as `https://example.invalid`, without trailing slash, path, query, fragment, default-port spelling or wildcard. Logo URLs require a separate asset allowlist. Subdomains and nondefault ports are separate origins. No URL is fetched or redirected by the renderer.

**Origin permission is not application authorization.** The consumer must validate route, purpose, intended recipient, tenant, expiration, token and any redirect destination within an approved origin before calling this library. Only list origins under your control. An allowed server's redirects, asset content and downstream behavior remain the service's responsibility. Never log full rendered messages, action URLs, verification codes or validation input. `EmailTemplateError` reports a field and generic rule, not a supplied value.

Input bounds: subject/name/alt 200 UTF-16 units; title/preheader/action label/detail label 1000; body item 16000; URL 8192; at most 100 items per section/origin list; 24000 combined content characters; dimensions 1–600 integer pixels. Oversized HTML is rejected before return. These are rendering limits, not mail transport header encoding rules: the sender must use its normal MIME/header encoder and supply both alternatives.

## Consumer handoff

Keep only service configuration and purpose-specific content builders in JN/qoqo. Import this fixed version instead of copying its HTML/CSS. Preserve existing auth-generated challenge/link, UUID/CAS, UNKNOWN-result recovery, authority checks, retry policy and transport adapter. Content including intended purpose, exact expiry/timezone and security instructions must come from the consumer's authoritative policy.

Supabase still owns authentication generation and validation. A CF sending layer can call this renderer when it receives an authorized hook/event; this package does not install that hook. Supabase's hosted HTML templates do not import npm modules directly: changing their delivery path is a separate integration task. JN's local email-change/magic-link previews are not proof of production saves. Do not derive JN email length/expiry from phone settings, or infer business membership from successful email verification.

## Development and verification

From the existing DDS workspace:

```sh
pnpm --filter @devslab-kr/dds-email-template check
pnpm --filter @devslab-kr/dds-email-template test
pnpm --filter @devslab-kr/dds-email-template build
pnpm --filter @devslab-kr/dds-email-template preview
pnpm --filter @devslab-kr/dds-email-template verify:browser
pnpm --filter @devslab-kr/dds-email-template verify:consumer
```

Preview output/evidence: root `test-results/dds-email-template/` (ignored). Seven permanent fixtures include both existing brands, explicit six/eight digit codes, details/action, long text and no-logo mail. They use fictional data, all-zero example codes and `example.invalid` actions. Packed consumer tooling uses the workspace's locked TypeScript and Miniflare/workerd dependencies, without shipping them. `node packages/dds-email-template/scripts/verify-package.mjs --registry=https://npm.pkg.github.com` verifies an already published exact version against the local tarball then executes that installed version; see the source progress document for the release record.

Browser verification measures real Chromium rendering, not Gmail/Outlook/Apple Mail delivery. Table/inline-CSS/MSO fallbacks reduce client differences but do not establish full email-client support. Actual inbox receipt and production integration remain separate acceptance work. No manual GitHub Actions dispatch is needed by these commands.

See `docs/superpowers/plans/2026-11-04-dds-email-template-progress.md` in the source repository for source SHA, validation evidence, independent review, release integrity and operational exclusions.
