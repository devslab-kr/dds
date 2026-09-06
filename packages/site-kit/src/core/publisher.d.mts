export interface PublisherIdentity {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly alternateName?: string | readonly string[];
  readonly sameAs?: readonly string[];
  readonly labels?: Readonly<Record<string, string>>;
  readonly defaultLabel?: string;
}
export interface PublisherOrganization {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  alternateName?: string | readonly string[];
  sameAs?: readonly string[];
}
export interface BuiltPublisher {
  organization: PublisherOrganization;
  reference: { "@id": string };
  link: { href: string; label: string };
}
export declare function definePublisher(input: PublisherIdentity): Readonly<PublisherIdentity>;
export declare function buildPublisher(identity: PublisherIdentity, options?: { locale?: string }): BuiltPublisher;
export declare function serializeJsonLd(value: unknown): string;
export declare function renderPublisherHtml(identity: PublisherIdentity, options?: { locale?: string; nonce?: string }): string;
