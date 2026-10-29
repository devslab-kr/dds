/** Runtime-neutral types for the generated private family-font artifact. */
export interface FontLink {
 rel:string; href:string; as?:'font'; type?:'font/woff2';
 crossorigin?:'anonymous'; crossOrigin?:'anonymous';
}
export interface FontOptions { monospace?:boolean; format?:'html'|'react' }
export interface FontAsset {
 id:string; file:string; bytes?:number; sha256?:string;
 family?:string; license?:string; [key:string]:unknown;
}
export interface FontManifest {
 schemaVersion:1; sourceRef?:string;
 css:{file:'fonts.css';[key:string]:unknown}; assets:FontAsset[];
 preload:{default:string[];monospace:string[]}; [key:string]:unknown;
}
export interface FontHeaderDescriptor { path:string; headers:{'Cache-Control':string} }
export interface FamilyFontAPI {
 fontManifest:FontManifest;
 getFontHeadLinks(baseURL:string,options?:FontOptions):FontLink[];
 getFontAssetHeaders(baseURL:string):FontHeaderDescriptor[];
 fontAssetHeaders(paths:readonly string[]):FontHeaderDescriptor[];
 withFamilyFontCache(request:Request,response:Response):Response;
 getBundleFontPreloadLinks(bundle:Record<string,unknown>|readonly unknown[],options?:FontOptions):FontLink[];
 getBundleFontAssetHeaders(bundle:Record<string,unknown>|readonly unknown[]):FontHeaderDescriptor[];
 isFamilyFontAssetRequest(request:Request,options:{baseURL:string}):boolean;
}
export declare const FAMILY_FONT_CACHE_CONTROL:'public, max-age=31536000, immutable';
export declare function fontPreloadLinksFromUrls(hrefs:readonly string[],options?:Pick<FontOptions,'format'>):FontLink[];
export declare function createFamilyFontAPI(manifest:FontManifest):FamilyFontAPI;
