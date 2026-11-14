# DDS Auth

Provider-neutral sign-in contracts, a controlled DDS React provider list, and a configurable login section. This package does not operate a central account service, store sessions, exchange OAuth codes, merge identities or infer provider approval.

## Install

The package is distributed on GitHub Packages, separate from the public npm DDS release train. When 0.2.0 is published, install it to use the provider catalog and opt-in options described below. Configure your user/project `.npmrc` with `@devslab-kr:registry=https://npm.pkg.github.com`. Authenticate using your organization's GitHub Packages read access; keep tokens in a user configuration or secret environment, never a committed file. DDS peers continue to resolve from the public npm registry.

```sh
npm install --save-exact @devslab-kr/dds-auth@0.2.0
# For /react and /styles.css; headless-only users do not need these optional peers:
npm install --save-exact @devslab/dds-react@0.29.2 react@19.3.0 react-dom@19.3.0
```

Keep the consumer lockfile. The package declares compatible DDS/React peer ranges; the example intentionally pins tested versions. No Query, Form, store or auth SDK dependency is installed by this package.

## Existing applications: controlled provider UI

Use `SocialLoginOptions` inside the product's existing account frame. It owns presentation only: no requests, timers, navigation or session state. Keep the application's Query mutation, native transport/cancel, invitation and legal checks, idempotency key, recently successful provider and account recovery flow.

```tsx
import { SocialLoginOptions } from "@devslab-kr/dds-auth/react";
import "@devslab-kr/dds-auth/styles.css";

<SocialLoginOptions
  aria-label="Social sign-in methods"
  providers={verifiedProviderAvailability}
  pendingProvider={pendingProvider}
  disabled={!consentReady || nativeUnavailable}
  loading={providerQueryPending}
  onSelect={startUsingExistingMutation}
  buttonLabel={(_id, label) => `${label} sign in`}
  providerIcons={officialProviderIcons}
  providerBadge={(id) =>
    id === recentlySuccessfulProvider ? <span>Recently used</span> : null
  }
/>;
```

`buttonClassName(provider)` preserves an application's approved provider styling. `providerHint(provider)` and `unavailableReason(provider)` add localized public explanations linked with `aria-describedby`. `onButtonRef(provider, element)` supports host-owned focus recovery. Missing, malformed or duplicate availability entries are disabled, including a missing Naver configuration. `available` must mean the service's actual verified configuration, not merely a supported TypeScript ID. If `loading` is true, all buttons are disabled and the root is busy; the host owns its loading announcement and errors.

## Choose providers for a service

Omitting `providerOrder` preserves the Google, Kakao and Naver options and caller-owned icons from 0.1.0. Opt in to the wider `SOCIAL_PROVIDER_CATALOG`: Google, Kakao, Naver, LINE, Microsoft, LinkedIn, Apple, Facebook, GitHub, GitLab, Discord, Figma, Notion, X, Slack, Zoom and WeChat. Pass only the IDs you intend to show, in the intended display order. Availability data alone does not add or activate any provider. An explicitly chosen provider without exactly one valid availability entry remains visible and disabled.

```tsx
import { createSocialAuthClient, type ProviderAvailability } from "@devslab-kr/dds-auth";
import { SocialLoginOptions } from "@devslab-kr/dds-auth/react";
import "@devslab-kr/dds-auth/styles.css";

const providerOrder = ["google", "github", "discord"] as const;
type ServiceProvider = (typeof providerOrder)[number];

const client = createSocialAuthClient({
  endpoint: "/api/social/start",
  fetch: (...args) => fetch(...args),
  providerOrder,
});

export function ServiceOptions({ providers, start }: {
  providers: readonly ProviderAvailability<ServiceProvider>[];
  start: (provider: ServiceProvider) => void;
}) {
  return <SocialLoginOptions providers={providers} providerOrder={providerOrder} onSelect={start} />;
}
```

For `LoginPanel`, pass this same `providerOrder` and `client` together. The product adapter owns actual provider setup, wire IDs, application credentials, callback validation and sessions. The generic `SocialAuthAdapter<Context, Session, ServiceProvider>` describes additional IDs at that boundary without changing legacy `SocialProvider`.

With `providerOrder`, the stylesheet loads the packaged verified marks. `providerIcons` can replace a mark or suppress one with `null`. GitLab is text only; Apple, Facebook and WeChat require product-approved artwork or provider-specific controls. Use your own approved treatment when a provider requires a specific sign-in button. See [asset usage and provenance](assets/README.md).

## Configurable login section

`LoginPanel` supplies brand/title/description, the provider list, progress, bounded public errors, explicit retry selection and terms/privacy links. It is a section rather than a full page. `children` can hold app-owned credential/consent UI; the section never implies legal consent.

```tsx
"use client";
import { useState } from "react";
import { createSocialAuthClient } from "@devslab-kr/dds-auth";
import { LoginPanel } from "@devslab-kr/dds-auth/react";
import "@devslab-kr/dds-auth/styles.css";

export function ServiceLogin({ providers }) {
  const [client] = useState(() =>
    createSocialAuthClient({
      endpoint: "/api/social/start",
      fetch: (...args) => fetch(...args),
      timeoutMs: 15000,
    }),
  );
  return (
    <LoginPanel
      brand={
        <img src="/brand/logo.svg" alt="Service" width={120} height={32} />
      }
      title="Sign in to your service"
      providers={providers}
      client={client}
      returnTo="/account"
      redirectOrigins={["https://your-auth-project.example"]}
      onRedirect={(url) => window.location.assign(url)}
      providerIcons={{
        google: <img src="/brand/social/google-g.png" alt="" />,
        kakao: <img src="/brand/social/kakao-symbol.svg" alt="" />,
        naver: <img src="/brand/social/naver-symbol.png" alt="" />,
      }}
      terms={{ href: "/terms", label: "Terms of service" }}
      privacy={{ href: "/privacy", label: "Privacy policy" }}
    />
  );
}
```

Copy the exported `assets/google-g.png`, `assets/kakao-symbol.svg` and `assets/naver-symbol.png` to the shown public paths, or use your bundler's asset URL import. Provenance/hashes and provider ownership are shipped in `assets/provenance.json` and `assets/README.md`. Preserve the provider's current branding rules; these files do not prove provider-console approval. A provider icon slot is decorative because the button already names the provider. No synthetic logos or data URIs are generated. Without icons, buttons use text labels.

`providers` entries are `{id, status:'available'}` or `{id, status:'unconfigured'|'disabled', reason:publicCode}`. Each selected provider remains visible. A missing client disables all options. `returnTo` is a service-local path. `redirectOrigins` must contain only exact HTTP(S) origins; any malformed origin invalidates the configuration. The server must apply stricter path/parameter and callback checks. `intent:'link'` and `requestId` are passed through without generating a new key; server authorization still determines whether linking is allowed. Ordinary encoded query values, including spaces and literal percent characters, are preserved.

`LoginPanel` starts at most one action at a time, bounds stalled custom adapters at 15 seconds (`timeoutMs`, clamped to 250–120000ms), aborts obsolete scope/provider/trust work, and blocks further actions during navigation. A timeout means the UI could not confirm the result, not that the server did nothing. The host must retain its idempotency/recovery rules before a deliberate subsequent attempt. `onRedirect` handles navigation; returning from it does not mark sign-in successful. A thrown adapter/provider message is never displayed. `error` accepts only a bounded callback code. `messages` replaces the Korean defaults (`loginMessagesKo`); `loginMessagesEn` is provided. `onAuthError` receives a sanitized failure. `retryable:false` hides the recovery button; it does not itself disable future deliberate provider selection. Supply disabled availability when policy requires a hard block.

## Headless transport and server adapters

The root entry has no React/browser import or runtime dependency. `createSocialAuthClient({endpoint, fetch, timeoutMs})` performs one same-origin credentialed, no-store JSON POST, sets `redirect:'error'`, forwards caller abort and returns `{status:'redirect',url}` or `{status:'error',code,retryable}`. It never retries. Network exceptions propagate to the host; its own timeout maps to `unavailable`. Existing APIs with different bodies/results should implement `SocialAuthClient.start` using their existing transport rather than changing endpoint contracts.

`SocialAuthAdapter<Context,Session>` is a request-scoped server contract with `providers`, `start`, `callback`, `session` and `signOut`. Start/callback/logout retain the original app `Response` so cookie headers, HTTP status, cache policy and redirects survive unchanged. `Session` is a generic app-owned server value, never a LoginPanel prop. This package provides a contract, not provider SDK implementations or session storage.

For qoqo, an adapter retains `@supabase/ssr` cookie exchange, sealed flow, exact return path/invitation, Naver profile verification, identity linking UUID/CAS and device/human/MFA checks. Map public `naver` to `custom:naver` only inside that adapter. For JN, retain its one-time DB attempt/PKCE, opaque cookie, encrypted BFF session and user/organization/contract permissions. Its legacy Accounts OIDC migration remains a separate flow. No email-only account merging, shared keys, shared sessions or cross-service permissions are introduced. Naver remains unconfigured until each service's real server/console setup is verified.

App adapters must preserve CSRF/origin checks, callback and redirect allowlists, PKCE/state/single-use expiry, HttpOnly/Secure cookies, server authorization, sign-out revocation, UUID/CAS and unknown-result recovery. Map provider errors to the public enum without copying raw provider descriptions, tokens or codes into UI logs. The basic `isSafeReturnTo` and `isSafeAuthRedirect` helpers supplement application allowlists; they do not replace them.

## State and verification

In Next.js consumers, Query owns provider/session queries and mutation orchestration, scoped to account/company/store as required and cleared on logout/scope change. TanStack Form owns app credential/consent inputs; this component has no business input form. Pending/error/navigation state in LoginPanel is local component state. Neither Zustand nor TanStack Store is needed for this isolated UI; do not introduce an account/session singleton. Shared UI state choices remain the application's documented Zustand/Store decision, preserving existing implementations and request/browser isolation.

Taste review kept the existing title, provider list and legal link hierarchy. Polish checks the same icon slot across verified marks, legible marks in both themes, narrow widths, readable labels, keyboard focus, disabled buttons and unchanged accessible names. This component stays inside the product's existing sign-in layout.

`pnpm --filter @devslab-kr/dds-auth test`, `check`, `build` cover contracts and user behavior. `verify:consumer` packs and installs into the tracked reusable `consumer` fixture, pins stable public DDS 0.29.2, checks types, Node/worker import, browser-free SSR and hydration identity. It creates no temporary project. `pnpm exec playwright test --config playwright.auth.config.ts` covers the explicit adapter simulation at `/login.html`: keyboard/recovery/loading/unconfigured states, desktop/tablet/mobile, both themes, long copy, real asset loading and axe. No test authenticates a real provider or proves production console readiness.
