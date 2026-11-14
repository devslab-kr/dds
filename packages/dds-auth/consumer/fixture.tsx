import { LoginPanel, SocialLoginOptions } from "@devslab-kr/dds-auth/react";
import {
  createSocialAuthClient,
  type ProviderAvailability,
  type SocialAuthAdapter,
} from "@devslab-kr/dds-auth";

export const client = createSocialAuthClient({
  endpoint: "/auth/start",
  fetch,
});
export const ui = (
  <LoginPanel
    brand="Packed service"
    title="Sign in"
    providers={[{ id: "google", status: "available" }]}
    client={client}
    returnTo="/account"
    redirectOrigins={["https://auth.example.test"]}
    onRedirect={() => {}}
    terms={{ href: "/terms", label: "Terms" }}
    privacy={{ href: "/privacy", label: "Privacy" }}
  />
);
export const controlled = (
  <SocialLoginOptions
    providers={[]}
    onSelect={() => {}}
    aria-label="Sign-in methods"
  />
);
export type Adapter = SocialAuthAdapter<
  { request: Request },
  { encryptedRef: string }
>;

const providerOrder = ["google", "github", "discord"] as const;
type ServiceProvider = (typeof providerOrder)[number];
const providers: readonly ProviderAvailability<ServiceProvider>[] = [
  { id: "google", status: "available" },
  { id: "discord", status: "disabled", reason: "service-policy" },
];
export const extendedClient = createSocialAuthClient({
  endpoint: "/auth/start",
  fetch,
  providerOrder,
});
export const extendedUi = (
  <LoginPanel
    brand="Packed service"
    title="Sign in"
    providers={providers}
    providerOrder={providerOrder}
    client={extendedClient}
    providerIcons={{ github: null }}
    returnTo="/account"
    redirectOrigins={["https://auth.example.test"]}
    onRedirect={() => {}}
    terms={{ href: "/terms", label: "Terms" }}
    privacy={{ href: "/privacy", label: "Privacy" }}
  />
);
