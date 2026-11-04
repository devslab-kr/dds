import { input } from "./input.mjs";

// Shared by Node and workerd. No Node, browser DOM, network, or mail APIs.
export function checkEmailApi({ renderEmail, EmailTemplateError }) {
  const require = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const result = renderEmail(input);
  require(result.subject === "Preview", "Packed subject contract failed");
  require(typeof result.html === "string", "Packed HTML contract failed");
  require(typeof result.text === "string", "Packed text contract failed");
  require(result.html.includes("00000000"), "HTML verification code missing");
  require(result.text.includes("00000000"), "Text verification code missing");
  require(result.text.includes(
    "https://example.invalid/view",
  ), "Plain-text action URL missing");
  let rejected;
  try {
    renderEmail({
      ...input,
      content: {
        ...input.content,
        action: { label: "View", url: "https://outside.invalid/view" },
      },
    });
  } catch (error) {
    rejected = error;
  }
  require(rejected instanceof EmailTemplateError &&
    rejected instanceof TypeError, "Packed validation error contract failed");
  require(!rejected.message.includes(
    "outside.invalid",
  ), "Validation error exposed a supplied URL");
  return {
    result,
    error: {
      name: rejected.name,
      field: rejected.field,
      message: rejected.message,
    },
  };
}
