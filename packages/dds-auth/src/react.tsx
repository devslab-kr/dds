"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "@devslab/dds-react";
import {
  authFailure,
  authTimeout,
  isSafeAuthRedirect,
  isSafeReturnTo,
  normalizeProviders,
  readSocialAuthStartResult,
  SOCIAL_PROVIDERS,
  type CatalogSocialProvider,
  type ProviderAvailability,
  type SocialAuthClient,
  type SocialAuthErrorCode,
  type SocialAuthFailure,
  type SocialAuthIntent,
  type SocialProvider,
} from "./index.js";

export interface LoginMessages {
  providers: Record<SocialProvider, string> & Partial<Record<CatalogSocialProvider, string>>;
  continueWith(provider: string): string;
  connecting(provider: string): string;
  redirecting: string;
  unavailable: string;
  unconfigured: string;
  retry: string;
  errors: Record<SocialAuthErrorCode, string>;
}

const additionalProviderNames = {
  line: "LINE",
  microsoft: "Microsoft",
  linkedin: "LinkedIn",
  apple: "Apple",
  facebook: "Facebook",
  github: "GitHub",
  gitlab: "GitLab",
  discord: "Discord",
  figma: "Figma",
  notion: "Notion",
  x: "X",
  slack: "Slack",
  zoom: "Zoom",
  wechat: "WeChat",
} satisfies Record<Exclude<CatalogSocialProvider, SocialProvider>, string>;

export const loginMessagesKo: LoginMessages = {
  providers: { google: "Google", kakao: "카카오", naver: "네이버", ...additionalProviderNames, wechat: "위챗" },
  continueWith: (provider) => `${provider}로 계속하기`,
  connecting: (provider) => `${provider} 로그인 페이지를 준비하고 있습니다.`,
  redirecting: "로그인 페이지로 이동하고 있습니다.",
  unavailable: "현재 사용할 수 없습니다.",
  unconfigured: "서비스의 로그인 연결 설정이 필요합니다.",
  retry: "다시 선택하기",
  errors: {
    cancelled: "로그인이 취소되었습니다. 로그인 방법을 다시 선택해 주세요.",
    unavailable:
      "로그인 연결을 확인하지 못했습니다. 잠시 후 다시 선택해 주세요.",
    "not-configured":
      "이 로그인 방법은 아직 연결되지 않았습니다. 다른 방법을 선택해 주세요.",
    "invalid-request":
      "로그인 요청 정보를 확인하지 못했습니다. 페이지를 다시 열어 주세요.",
    "invalid-response":
      "로그인 응답을 확인하지 못했습니다. 잠시 후 다시 선택해 주세요.",
    "flow-expired":
      "로그인 시간이 만료되었습니다. 로그인 방법을 다시 선택해 주세요.",
    forbidden:
      "이 계정에서 요청한 로그인을 진행할 수 없습니다. 서비스 안내를 확인해 주세요.",
    failed:
      "로그인을 시작하지 못했습니다. 연결 상태를 확인하고 다시 선택해 주세요.",
  },
};

export const loginMessagesEn: LoginMessages = {
  providers: { google: "Google", kakao: "Kakao", naver: "Naver", ...additionalProviderNames },
  continueWith: (provider) => `Continue with ${provider}`,
  connecting: (provider) => `Preparing ${provider} sign-in.`,
  redirecting: "Opening the sign-in page.",
  unavailable: "Currently unavailable.",
  unconfigured: "This sign-in method needs service configuration.",
  retry: "Choose again",
  errors: {
    cancelled: "Sign-in was cancelled. Choose a sign-in method again.",
    unavailable: "Sign-in is unavailable. Please try again shortly.",
    "not-configured":
      "This sign-in method is not connected yet. Choose another method.",
    "invalid-request":
      "The sign-in request could not be verified. Reopen this page.",
    "invalid-response":
      "The sign-in response could not be verified. Please try again shortly.",
    "flow-expired":
      "The sign-in attempt expired. Choose a sign-in method again.",
    forbidden:
      "This account cannot continue with this sign-in request. Check the service guidance.",
    failed: "Sign-in could not start. Check your connection and choose again.",
  },
};

function providerName(provider: CatalogSocialProvider, messages: LoginMessages): string {
  return messages.providers[provider] ?? loginMessagesEn.providers[provider] ?? provider;
}

export interface LoginLink {
  href: string;
  label: string;
}

export interface SocialLoginOptionsProps<Provider extends CatalogSocialProvider = SocialProvider> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect" | "children"
> {
  providers: readonly ProviderAvailability<Provider>[];
  pendingProvider?: Provider | null;
  disabled?: boolean;
  loading?: boolean;
  onSelect(provider: Provider): void;
  messages?: LoginMessages;
  providerIcons?: Partial<Record<Provider, ReactNode>>;
  providerBadge?(provider: Provider): ReactNode;
  buttonLabel?(provider: Provider, label: string): ReactNode;
  buttonClassName?(provider: Provider): string | undefined;
  providerHint?(provider: ProviderAvailability<Provider>): ReactNode;
  unavailableReason?(provider: ProviderAvailability<Provider>): ReactNode;
  onButtonRef?(
    provider: Provider,
    element: HTMLButtonElement | null,
  ): void;
}

type WithProviderOrder<Provider extends CatalogSocialProvider> = {
  /** Explicit provider allowlist and display order for this surface. */
  providerOrder: readonly Provider[];
};

const providersWithPackagedMarks = new Set<CatalogSocialProvider>([
  "google",
  "kakao",
  "naver",
  "line",
  "microsoft",
  "linkedin",
  "github",
  "discord",
  "figma",
  "notion",
  "x",
  "slack",
  "zoom",
]);

/** Controlled UI only: the host retains Query mutations, native transport/cancel, consent and recent-provider state. */
export function SocialLoginOptions(props: SocialLoginOptionsProps): ReactNode;
export function SocialLoginOptions<const Provider extends CatalogSocialProvider>(
  props: SocialLoginOptionsProps<NoInfer<Provider>> & WithProviderOrder<Provider>,
): ReactNode;
export function SocialLoginOptions(
  props: SocialLoginOptionsProps<CatalogSocialProvider> &
    Partial<WithProviderOrder<CatalogSocialProvider>>,
) {
  return <SocialLoginOptionsView {...props} />;
}

function SocialLoginOptionsView({
  providers,
  providerOrder,
  pendingProvider,
  disabled,
  loading,
  onSelect,
  messages = loginMessagesKo,
  providerIcons,
  providerBadge,
  buttonLabel,
  buttonClassName,
  providerHint,
  unavailableReason,
  onButtonRef,
  id,
  className,
  ...rest
}: SocialLoginOptionsProps<CatalogSocialProvider> & Partial<WithProviderOrder<CatalogSocialProvider>>) {
  const generated = useId();
  const rootId = id ?? `dds-social-${generated}`;
  const entries = normalizeProviders(providers, providerOrder ?? SOCIAL_PROVIDERS);
  return (
    <div
      {...rest}
      id={rootId}
      className={[
        "dds-login__providers",
        providerOrder && "dds-login__providers--ordered",
        className,
      ].filter(Boolean).join(" ")}
      role={rest.role ?? "group"}
      aria-busy={Boolean(pendingProvider) || loading || undefined}
    >
      {entries.map((provider) => {
        const label = providerName(provider.id, messages);
        const available = provider.status === "available";
        const reason =
          !loading &&
          !available &&
          (unavailableReason?.(provider) ||
            (provider.status === "disabled"
              ? messages.unavailable
              : messages.unconfigured));
        const hint = providerHint?.(provider);
        const badge = providerBadge?.(provider.id);
        const icon = providerIcons?.[provider.id];
        const usePackagedMark =
          providerOrder !== undefined &&
          icon === undefined &&
          providersWithPackagedMarks.has(provider.id);
        const helpId = `${rootId}-${provider.id}-help`;
        return (
          <div
            key={provider.id}
            className="dds-login__provider"
            data-provider={provider.id}
            data-status={provider.status}
          >
            <Button
              ref={(element) => onButtonRef?.(provider.id, element)}
              tone="secondary"
              size="lg"
              className={["dds-login__button", buttonClassName?.(provider.id)]
                .filter(Boolean)
                .join(" ")}
              data-social-provider={provider.id}
              loading={pendingProvider === provider.id}
              disabled={
                disabled || loading || Boolean(pendingProvider) || !available
              }
              aria-describedby={reason || hint ? helpId : undefined}
              onClick={() => {
                if (!disabled && !loading && !pendingProvider && available)
                  onSelect(provider.id);
              }}
            >
              {(icon || usePackagedMark) && (
                <span
                  className="dds-login__provider-icon"
                  data-packaged-mark={usePackagedMark ? "" : undefined}
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              <span className={providerOrder ? "dds-login__provider-label" : undefined}>
                {buttonLabel
                  ? buttonLabel(provider.id, label)
                  : messages.continueWith(label)}
                {providerOrder && badge ? <> {badge}</> : null}
              </span>
              {!providerOrder && badge ? <> {badge}</> : null}
            </Button>
            {(reason || hint) && (
              <div id={helpId} className="dds-login__provider-help">
                {reason}
                {reason && hint ? " " : null}
                {hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface LoginPanelProps<Provider extends CatalogSocialProvider = SocialProvider> extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children" | "onError"
> {
  brand: ReactNode;
  title: string;
  description?: ReactNode;
  providers: readonly ProviderAvailability<Provider>[];
  client?: SocialAuthClient<Provider>;
  returnTo: string;
  intent?: SocialAuthIntent;
  requestId?: string;
  /** Trusted authorization/BFF origins, verified again by the app server. */
  redirectOrigins: readonly string[];
  onRedirect(url: string): void | Promise<void>;
  terms: LoginLink;
  privacy: LoginLink;
  /** Optional public callback error. Never pass a raw OAuth/provider error message. */
  error?: SocialAuthErrorCode;
  messages?: LoginMessages;
  providerIcons?: Partial<Record<Provider, ReactNode>>;
  /** Render a public, localized explanation; reason is a code from service configuration. */
  unavailableReason?(provider: ProviderAvailability<Provider>): ReactNode;
  onAuthError?(failure: SocialAuthFailure): void;
  /** Defaults to 15 seconds. A timeout aborts UI work and asks the user to choose again. */
  timeoutMs?: number;
  /** Optional app-owned credential form/consent content; no implied legal consent. */
  children?: ReactNode;
}

function safeLegalHref(value: string): string | undefined {
  if (/^#[A-Za-z][\w-]*$/.test(value)) return value;
  if (isSafeReturnTo(value)) return value;
  try {
    const url = new URL(value);
    return isSafeAuthRedirect(value, [url.origin]) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** A reusable login section, not a session provider or a whole product page. */
export function LoginPanel(props: LoginPanelProps): ReactNode;
export function LoginPanel<const Provider extends CatalogSocialProvider>(
  props: LoginPanelProps<NoInfer<Provider>> & WithProviderOrder<Provider>,
): ReactNode;
export function LoginPanel({
  brand,
  title,
  description,
  providers,
  providerOrder,
  client,
  returnTo,
  intent = "sign-in",
  requestId,
  redirectOrigins,
  onRedirect,
  terms,
  privacy,
  error,
  messages = loginMessagesKo,
  providerIcons,
  unavailableReason,
  onAuthError,
  timeoutMs,
  children,
  id,
  className,
  ...rest
}: LoginPanelProps<CatalogSocialProvider> & Partial<WithProviderOrder<CatalogSocialProvider>>) {
  const generated = useId();
  const rootId = id ?? `dds-login-${generated}`;
  const [pending, setPending] = useState<CatalogSocialProvider | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [failure, setFailure] = useState<SocialAuthFailure | null>(null);
  const active = useRef<AbortController | null>(null);
  const navigating = useRef(false);
  const retryRef = useRef<HTMLButtonElement>(null);
  const providerRefs = useRef<
    Partial<Record<CatalogSocialProvider, HTMLButtonElement | null>>
  >({});
  const lastProvider = useRef<CatalogSocialProvider | null>(null);
  const entries = normalizeProviders(providers, providerOrder ?? SOCIAL_PROVIDERS);
  const providerScope = entries
    .map((entry) => `${entry.id}:${entry.status}`)
    .join("|");
  const redirectScope = redirectOrigins.join("|");
  const validReturn = isSafeReturnTo(returnTo);
  const errorCode =
    failure?.code ?? error ?? (!validReturn ? "invalid-request" : undefined);

  // Changing auth scope invalidates an in-flight UI result; server flow/session remains app-owned.
  useEffect(() => {
    active.current?.abort();
    active.current = null;
    navigating.current = false;
    setPending(null);
    setRedirecting(false);
    setFailure(null);
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [client, returnTo, intent, requestId, providerScope, redirectScope]);
  useEffect(() => {
    if (failure?.retryable) retryRef.current?.focus();
  }, [failure]);

  async function start(provider: CatalogSocialProvider) {
    if (
      active.current ||
      navigating.current ||
      !client ||
      !validReturn ||
      entries.find((item) => item.id === provider)?.status !== "available"
    )
      return;
    const controller = new AbortController();
    active.current = controller;
    lastProvider.current = provider;
    setPending(provider);
    setRedirecting(false);
    setFailure(null);
    const fail = (value: SocialAuthFailure) => {
      setFailure(value);
      // A diagnostic callback must not turn a known error into a second auth action.
      try {
        onAuthError?.(value);
      } catch {
        /* Host diagnostics are outside the auth flow. */
      }
    };
    const timeout = setTimeout(() => {
      if (controller.signal.aborted || active.current !== controller) return;
      controller.abort();
      active.current = null;
      navigating.current = false;
      setPending(null);
      setRedirecting(false);
      fail(authFailure("unavailable"));
    }, authTimeout(timeoutMs));
    controller.signal.addEventListener("abort", () => clearTimeout(timeout), {
      once: true,
    });
    try {
      const result = readSocialAuthStartResult(
        await client.start(
          { provider, returnTo, intent, ...(requestId ? { requestId } : {}) },
          { signal: controller.signal },
        ),
      );
      if (controller.signal.aborted || active.current !== controller) return;
      if (result.status === "error") {
        fail(result);
        return;
      }
      if (!isSafeAuthRedirect(result.url, redirectOrigins)) {
        fail(authFailure("invalid-response"));
        return;
      }
      navigating.current = true;
      setRedirecting(true);
      await onRedirect(result.url);
      // Navigation completion is not authentication success. Stay busy until the host unmounts.
    } catch {
      if (!controller.signal.aborted && active.current === controller) {
        navigating.current = false;
        setRedirecting(false);
        fail(authFailure());
      }
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted && active.current === controller) {
        active.current = null;
        setPending(null);
      }
    }
  }

  function resetFailure() {
    setFailure(null);
    if (lastProvider.current)
      providerRefs.current[lastProvider.current]?.focus();
  }

  return (
    <section
      {...rest}
      id={rootId}
      className={["dds-login", className].filter(Boolean).join(" ")}
      aria-labelledby={`${rootId}-title`}
    >
      <header className="dds-login__header">
        <div className="dds-login__brand">{brand}</div>
        <h2 id={`${rootId}-title`} className="dds-login__title">
          {title}
        </h2>
        {description && (
          <div className="dds-login__description">{description}</div>
        )}
      </header>
      {children && <div className="dds-login__content">{children}</div>}
      <SocialLoginOptionsView
        {...(providerOrder ? { providerOrder } : {})}
        providers={
          client
            ? entries
            : entries.map((provider) => ({
                id: provider.id,
                status: "unconfigured",
                reason: "client-not-configured",
              }))
        }
        pendingProvider={pending ?? (redirecting ? lastProvider.current : null)}
        disabled={redirecting || !validReturn}
        onSelect={(provider) => {
          void start(provider);
        }}
        messages={messages}
        providerIcons={providerIcons}
        unavailableReason={unavailableReason}
        onButtonRef={(provider, element) => {
          providerRefs.current[provider] = element;
        }}
      />
      <p
        className="dds-login__progress"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {redirecting
          ? messages.redirecting
          : pending
            ? messages.connecting(providerName(pending, messages))
            : ""}
      </p>
      {errorCode && (
        <div className="dds-login__error">
          <p role="alert">{messages.errors[errorCode]}</p>
          {failure?.retryable && (
            <Button ref={retryRef} tone="secondary" onClick={resetFailure}>
              {messages.retry}
            </Button>
          )}
        </div>
      )}
      <footer className="dds-login__legal">
        {[terms, privacy].map((link, index) => {
          const href = safeLegalHref(link.href);
          return href ? (
            <a key={index} href={href}>
              {link.label}
            </a>
          ) : (
            <span key={index}>{link.label}</span>
          );
        })}
      </footer>
    </section>
  );
}
