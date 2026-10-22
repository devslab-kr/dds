import { test, expect } from "@playwright/test";
test("shared layout typography and spacing",async({page})=>{
 await page.goto("/tests/fixtures/layouts/index.html");
 await expect(page.locator("h1")).toHaveCSS("font-size","24px");
 await expect(page.locator("h1")).toHaveCSS("line-height","32px");
 await expect(page.locator("h1")).toHaveCSS("font-weight","700");
 await expect(page.locator("p")).toHaveCSS("font-size","14px");
 await expect(page.locator(".dds-layout__main")).toHaveCSS("padding-inline-start","32px");
 await page.setViewportSize({width:390,height:800});
 await expect(page.locator(".dds-layout__main")).toHaveCSS("padding-inline-start","16px");
});
