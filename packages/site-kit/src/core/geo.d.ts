export interface VerifiedFact { id: string; value: string; sourceUrl: string; verifiedAt: string; expiresAt?: string }
export declare class VerifiedFactRegistry {
  constructor(facts: VerifiedFact[], options?: { now?: string });
  get(id: string): Readonly<VerifiedFact>;
  all(): Array<Readonly<VerifiedFact>>;
}
export type FactClaim = { factId: string } | FactClaim[] | { [key: string]: FactClaim };
export type VerifiedSchemaType = "Organization" | "WebSite" | "SoftwareApplication" | "Product" | "BreadcrumbList" | "FAQPage" | "TechArticle";
export declare function buildVerifiedJsonLd(input: { type: VerifiedSchemaType; id: string; identity: { name: string; url: string; logo?: string }; claims?: Record<string, FactClaim> }, registry: VerifiedFactRegistry): Record<string, unknown>;
export declare function renderLlmsTxt(input: { title: string; summary: string; canonicalUrl: string; facts: VerifiedFactRegistry }): string;
