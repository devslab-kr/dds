/** @type {import("@devslab-kr/dds-email-template").RenderEmailInput} */
export const input = {
  brand: {
    name: "Sample",
    colors: { primary: "#2755e9" },
    logo: {
      url: "https://assets.example.invalid/logo.png",
      width: 80,
      height: 24,
      alt: "Sample",
    },
  },
  content: {
    subject: "Preview",
    title: "Verify",
    verification: {
      code: "00000000",
      digits: 8,
      instruction: "Sample only",
    },
    action: { label: "View", url: "https://example.invalid/view" },
  },
  policy: {
    allowedActionOrigins: ["https://example.invalid"],
    allowedAssetOrigins: ["https://assets.example.invalid"],
  },
  language: "en",
};
