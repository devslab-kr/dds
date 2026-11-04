import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { EmailTemplateError, renderEmail } from "../src/index.mjs";

// Reuse the workspace's declared DOM test dependency; the renderer stays dependency-free.
const { JSDOM } = createRequire(
  new URL("../../dds-auth/package.json", import.meta.url),
)("jsdom");

function document(html) {
  return new JSDOM(html).window.document;
}

function input() {
  return {
    brand: { name: "Example & Co", colors: { primary: "#2457d6" } },
    content: { subject: "Account confirmation", title: "Confirm your account" },
    policy: { allowedActionOrigins: ["https://account.example.test"] },
  };
}

function completeInput() {
  const value = input();
  value.language = "ko";
  value.brand.logo = {
    url: "https://assets.example.test/logo.png",
    width: 120,
    height: 32,
    alt: "Example company logo",
  };
  value.policy.allowedAssetOrigins = ["https://assets.example.test"];
  value.content = {
    subject: "Account confirmation",
    title: "Confirm your account",
    preheader: "Complete your requested account confirmation.",
    introduction: ["안녕하세요, Alex님.", "You requested this confirmation."],
    details: [{ label: "Workspace", value: "Research & Development" }],
    verification: {
      code: "001234",
      digits: 6,
      instruction: "Enter this code on your open confirmation screen.",
    },
    action: {
      label: "Confirm account",
      url: "https://account.example.test/confirm?ticket=synthetic-test-ticket&next=%2Fhome",
    },
    safety: ["If you did not request this, ignore this message."],
    footer: ["Example Operations", "support@example.test"],
  };
  return value;
}

function expectInvalid(value, field) {
  assert.throws(
    () => renderEmail(value),
    (error) => {
      assert.ok(error instanceof EmailTemplateError);
      assert.equal(error.name, "EmailTemplateError");
      assert.match(error.message, new RegExp(field.replaceAll(".", "\\.")));
      return true;
    },
  );
}

test("minimal content renders a subject, HTML body, and useful plain-text body", () => {
  const result = renderEmail(input());

  assert.deepEqual(Object.keys(result).sort(), ["html", "subject", "text"]);
  assert.equal(result.subject, "Account confirmation");
  assert.match(result.html, /Confirm your account/);
  assert.match(result.html, /Example &amp; Co/);
  assert.match(result.text, /Confirm your account/);
  assert.match(result.text, /Example & Co/);
  assert.doesNotMatch(result.html, /<a\b|<img\b/i);
  assert.doesNotMatch(
    result.text,
    /\b(?:expires?|minutes?|hours?)\b|만료|분 이내|시간 이내/i,
  );
});

test("all supplied content survives in plain text, including the action URL and leading-zero code", () => {
  const value = completeInput();
  const result = renderEmail(value);
  const body = document(result.html).body;

  for (const expected of [
    value.brand.name,
    value.content.title,
    value.content.preheader,
    ...value.content.introduction,
    value.content.details[0].label,
    value.content.details[0].value,
    value.content.verification.code,
    value.content.verification.instruction,
    value.content.action.label,
    value.content.action.url,
    ...value.content.safety,
    ...value.content.footer,
  ]) {
    assert.ok(
      result.text.includes(expected),
      "Plain text must retain each supplied content field",
    );
    assert.ok(
      body.textContent.includes(expected),
      "HTML must retain each supplied content field",
    );
  }
  assert.doesNotMatch(result.text, /&(?:amp|lt|gt|quot|#39|#x27);/i);
});

test("text fields are escaped as text and cannot create HTML elements or event attributes", () => {
  const value = completeInput();
  const payload = "<script data-untrusted=\"yes\">alert('x')</script> & text";
  value.brand.name = payload;
  value.brand.logo.alt = payload;
  value.content.subject = payload;
  value.content.title = payload;
  value.content.preheader = payload;
  value.content.introduction = [payload];
  value.content.details = [{ label: payload, value: payload }];
  value.content.verification.instruction = payload;
  value.content.action.label = payload;
  value.content.safety = [payload];
  value.content.footer = [payload];

  const result = renderEmail(value);

  assert.equal(result.subject, payload);
  assert.ok(result.text.includes(payload));
  const dom = document(result.html);
  assert.equal(dom.querySelectorAll("script, [data-untrusted]").length, 0);
  assert.equal(dom.title, payload);
  assert.ok(dom.body.textContent.includes(payload));
  const images = dom.querySelectorAll("img");
  assert.equal(images.length, 1);
  assert.equal(images[0].getAttribute("alt"), payload);
});

test("approved logo URLs retain explicit accessible alt text and dimensions", () => {
  const result = renderEmail(completeInput());
  const images = document(result.html).querySelectorAll("img");
  assert.equal(images.length, 1);
  assert.equal(
    images[0].getAttribute("src"),
    "https://assets.example.test/logo.png",
  );
  assert.equal(images[0].getAttribute("alt"), "Example company logo");
  assert.equal(images[0].getAttribute("width"), "120");
  assert.equal(images[0].getAttribute("height"), "32");
});

test("action query parameters survive rendering while HTML attribute delimiters are escaped", () => {
  const value = completeInput();
  const result = renderEmail(value);
  const links = document(result.html).querySelectorAll("a");
  assert.ok(
    [...links].some(
      (link) => link.getAttribute("href") === value.content.action.url,
    ),
  );
  assert.ok(result.text.includes(value.content.action.url));
});

test("rendering does not log query values or content", () => {
  let calls = 0;
  const methods = ["log", "info", "warn", "error", "debug"];
  const previous = methods.map((method) => console[method]);
  try {
    for (const method of methods)
      console[method] = () => {
        calls += 1;
      };
    renderEmail(completeInput());
  } finally {
    methods.forEach((method, index) => {
      console[method] = previous[index];
    });
  }
  assert.equal(
    calls,
    0,
    "The pure renderer must not write content to the console",
  );
});

for (const [digits, code] of [
  [6, "001234"],
  [8, "00001234"],
]) {
  test(`explicit ${digits}-digit verification retains leading zeroes with an action`, () => {
    const value = completeInput();
    value.content.verification = {
      digits,
      code,
      instruction: "Enter the displayed code.",
    };
    const result = renderEmail(value);
    assert.ok(result.html.includes(code));
    assert.ok(result.text.includes(code));
    assert.ok(result.text.includes(value.content.action.url));
  });
}

test("verification requires explicit six or eight ASCII digits", async (t) => {
  const cases = [
    [
      "missing digit declaration",
      { code: "001234", instruction: "Enter code." },
    ],
    [
      "unsupported count",
      { digits: 7, code: "0012345", instruction: "Enter code." },
    ],
    ["numeric code", { digits: 6, code: 123456, instruction: "Enter code." }],
    ["short code", { digits: 6, code: "01234", instruction: "Enter code." }],
    ["long code", { digits: 8, code: "000012345", instruction: "Enter code." }],
    [
      "fullwidth digits",
      { digits: 6, code: "１２３４５６", instruction: "Enter code." },
    ],
    [
      "Arabic digits",
      { digits: 6, code: "١٢٣٤٥٦", instruction: "Enter code." },
    ],
    ["whitespace", { digits: 6, code: "12345 ", instruction: "Enter code." }],
  ];
  for (const [name, verification] of cases) {
    await t.test(name, () => {
      const value = input();
      value.content.verification = verification;
      expectInvalid(value, "content.verification");
    });
  }
});

test("subject rejects header injection, Unicode separators, and control characters", async (t) => {
  const forbidden = [
    "\r",
    "\n",
    "\r\nBcc: hidden@example.test",
    "\u0000",
    "\t",
    "\u007f",
    "\u0085",
    "\u2028",
    "\u2029",
  ];
  for (const [index, separator] of forbidden.entries()) {
    await t.test(`forbidden separator ${index + 1}`, () => {
      const value = input();
      value.content.subject = `Confirmation${separator}continued`;
      expectInvalid(value, "content.subject");
    });
  }
});

test("required text rejects blanks and body controls while preserving body line feeds", async (t) => {
  const setters = [
    [
      "brand.name",
      (v, text) => {
        v.brand.name = text;
      },
    ],
    [
      "content.subject",
      (v, text) => {
        v.content.subject = text;
      },
    ],
    [
      "content.title",
      (v, text) => {
        v.content.title = text;
      },
    ],
    [
      "content.introduction",
      (v, text) => {
        v.content.introduction = [text];
      },
    ],
    [
      "content.details",
      (v, text) => {
        v.content.details = [{ label: text, value: "Value" }];
      },
    ],
    [
      "content.details",
      (v, text) => {
        v.content.details = [{ label: "Label", value: text }];
      },
    ],
    [
      "content.verification",
      (v, text) => {
        v.content.verification = {
          code: "001234",
          digits: 6,
          instruction: text,
        };
      },
    ],
    [
      "content.action",
      (v, text) => {
        v.content.action = {
          label: text,
          url: "https://account.example.test/confirm",
        };
      },
    ],
    [
      "content.safety",
      (v, text) => {
        v.content.safety = [text];
      },
    ],
    [
      "content.footer",
      (v, text) => {
        v.content.footer = [text];
      },
    ],
  ];
  for (const [index, [field, set]] of setters.entries()) {
    await t.test(`text field ${index + 1}`, () => {
      for (const text of [
        "",
        "   ",
        "\n",
        "value\u0000hidden",
        "value\rhidden",
        "value\thidden",
        "value\u007fhidden",
        "value\u0085hidden",
      ]) {
        const value = input();
        set(value, text);
        expectInvalid(value, field);
      }
    });
  }
  const value = input();
  value.content.introduction = ["First line\nSecond line"];
  assert.ok(renderEmail(value).text.includes("First line\nSecond line"));
});

test("brand colors accept only short or full hexadecimal CSS colors", async (t) => {
  for (const color of ["#aB3", "#12aBCf"]) {
    const value = input();
    value.brand.colors.primary = color;
    assert.equal(typeof renderEmail(value).html, "string");
  }
  const fields = [
    "primary",
    "onPrimary",
    "heading",
    "text",
    "muted",
    "background",
    "surface",
    "border",
  ];
  for (const field of fields) {
    await t.test(field, () => {
      for (const color of [
        "red",
        "#1234",
        "#12345678",
        "#12xz34",
        " #123456",
        "#123456 ",
        "#123456; background:url(https://tracker.invalid)",
        "var(--color)",
      ]) {
        const value = input();
        value.brand.colors[field] = color;
        expectInvalid(value, `brand.colors.${field}`);
      }
    });
  }
});

test("action destinations require unobfuscated absolute HTTPS URLs at an exact approved origin", async (t) => {
  const urls = [
    "http://account.example.test/confirm",
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "//account.example.test/confirm",
    "/confirm",
    "https://sub.account.example.test/confirm",
    "https://account.example.test.evil.invalid/confirm",
    "https://account.example.test:8443/confirm",
    "https://user:password@account.example.test/confirm",
    "https://account.example.test@evil.invalid/confirm",
    "https:\\account.example.test\\confirm",
    "https://account.example.test/confirm\\next",
    " https://account.example.test/confirm",
    "https://account.example.test/confirm ",
    "https://account.example.test/confirm\nignored",
    "https://account.example.test/confirm\rignored",
    "https://account.example.test/confirm\tignored",
    "https://account.example.test/confirm\u0000ignored",
    "https://account.example.test/confirm\u00a0ignored",
    "https://account.example.test/confirm?ticket=one%0d%0aBcc:injected",
    "https://account.example.test/confirm?ticket=one%0Dignored",
    "https://account.example.test/confirm?ticket=one%0Aignored",
  ];
  for (const [index, url] of urls.entries()) {
    await t.test(`invalid destination ${index + 1}`, () => {
      const value = input();
      value.content.action = { label: "Confirm account", url };
      expectInvalid(value, "content.action.url");
    });
  }
});

test("an empty action allowlist fails closed", () => {
  const value = completeInput();
  value.policy.allowedActionOrigins = [];
  expectInvalid(value, "content.action.url");
});

test("logo loading fails closed without a separate asset origin allowlist", () => {
  const value = completeInput();
  delete value.policy.allowedAssetOrigins;
  expectInvalid(value, "brand.logo.url");
  value.policy.allowedAssetOrigins = [];
  expectInvalid(value, "brand.logo.url");
});

test("asset destinations enforce HTTPS and their own exact approved origins", async (t) => {
  const urls = [
    "http://assets.example.test/logo.png",
    "//assets.example.test/logo.png",
    "data:image/png;base64,AAAA",
    "https://account.example.test/logo.png",
    "https://sub.assets.example.test/logo.png",
    "https://user:password@assets.example.test/logo.png",
    "https://assets.example.test/logo.png\nignored",
    "https://assets.example.test\\logo.png",
    "https://assets.example.test/logo.png?name=one%0D%0Ainjected",
  ];
  for (const [index, url] of urls.entries()) {
    await t.test(`invalid asset ${index + 1}`, () => {
      const value = completeInput();
      value.brand.logo.url = url;
      expectInvalid(value, "brand.logo.url");
    });
  }
});

test("allowlist entries must be origins rather than silently normalized URLs", async (t) => {
  const origins = [
    "http://account.example.test",
    "https://account.example.test/path",
    "https://account.example.test/",
    "https://account.example.test?query=ignored",
    "https://account.example.test#fragment",
    "https://user:password@account.example.test",
    "https://*.example.test",
    "*.example.test",
    "//account.example.test",
    " https://account.example.test",
    "https://account.example.test\n",
    "https:\\account.example.test",
  ];
  for (const field of ["allowedActionOrigins", "allowedAssetOrigins"]) {
    await t.test(field, () => {
      for (const origin of origins) {
        const value = completeInput();
        value.policy[field] = [origin];
        expectInvalid(value, `policy.${field}`);
      }
    });
  }
});

test("logos require nonblank alt text and explicit positive integer dimensions", async (t) => {
  for (const field of ["width", "height"]) {
    await t.test(field, () => {
      for (const dimension of [undefined, 0, -1, 1.5, "120", Infinity]) {
        const value = completeInput();
        value.brand.logo[field] = dimension;
        expectInvalid(value, `brand.logo.${field}`);
      }
    });
  }
  for (const alt of [undefined, "", "  ", "logo\u0000hidden"]) {
    const value = completeInput();
    value.brand.logo.alt = alt;
    expectInvalid(value, "brand.logo.alt");
  }
});

test("arbitrary markup, headers, and styles are outside the accepted input contract", async (t) => {
  const setters = [
    (v) => {
      v.html = "<script>alert(1)</script>";
    },
    (v) => {
      v.headers = { Bcc: "hidden@example.test" };
    },
    (v) => {
      v.content.html = "<script>alert(1)</script>";
    },
    (v) => {
      v.brand.style = "background:url(https://tracker.invalid)";
    },
  ];
  for (const [index, set] of setters.entries()) {
    await t.test(`unsupported customization ${index + 1}`, () => {
      const value = input();
      set(value);
      assert.throws(() => renderEmail(value), EmailTemplateError);
    });
  }
});

test("validation errors identify fields without disclosing raw URLs, queries, or content", () => {
  const secret = "synthetic-private-ticket-78129";
  const invalidValues = [
    (v) => {
      v.content.action = {
        label: "Confirm",
        url: `https://unapproved.invalid/confirm?ticket=${secret}`,
      };
    },
    (v) => {
      v.content.subject = `${secret}\r\nBcc: private@example.test`;
    },
    (v) => {
      v.content.verification = {
        code: secret,
        digits: 6,
        instruction: "Enter code.",
      };
    },
  ];
  for (const set of invalidValues) {
    const value = input();
    set(value);
    assert.throws(
      () => renderEmail(value),
      (error) => {
        assert.ok(error instanceof EmailTemplateError);
        assert.match(error.message, /content\./);
        assert.ok(
          !String(error).includes(secret),
          "Error text must not echo supplied values",
        );
        assert.ok(
          !error.stack?.includes(secret),
          "Error stacks must not echo supplied values",
        );
        assert.ok(
          !JSON.stringify(error).includes(secret),
          "Errors must not attach supplied values",
        );
        assert.doesNotMatch(
          error.message,
          /unapproved\.invalid|private@example\.test/,
        );
        return true;
      },
    );
  }
});

test("rendering leaves caller-owned content and policy unchanged", () => {
  const value = completeInput();
  const original = structuredClone(value);
  const first = renderEmail(value);
  const second = renderEmail(value);
  assert.deepEqual(value, original);
  assert.deepEqual(first, second);
});

test("body line feeds survive in plain text and render as HTML line breaks", () => {
  const value = input();
  value.content.introduction = ["First line\nSecond line"];
  const result = renderEmail(value);
  assert.ok(result.text.includes("First line\nSecond line"));
  const paragraphs = document(result.html).querySelectorAll("p");
  const paragraph = [...paragraphs].find((element) =>
    element.textContent.includes("First line"),
  );
  assert.ok(paragraph);
  assert.equal(paragraph.textContent, "First lineSecond line");
  assert.equal(paragraph.querySelectorAll("br").length, 1);
});

test("an explicitly approved HTTPS port is distinct from the default port", () => {
  const value = input();
  value.policy.allowedActionOrigins = ["https://account.example.test:8443"];
  value.content.action = {
    label: "Confirm",
    url: "https://account.example.test:8443/confirm",
  };
  const result = renderEmail(value);
  assert.equal(
    document(result.html).querySelector("a").getAttribute("href"),
    value.content.action.url,
  );
  value.content.action.url = "https://account.example.test/confirm";
  expectInvalid(value, "content.action.url");
});

test("malformed objects and collection items fail through the public validation error", async (t) => {
  const cases = [
    ["null input", () => null, "input"],
    ["array input", () => [], "input"],
    [
      "missing brand",
      (v) => {
        delete v.brand;
        return v;
      },
      "brand",
    ],
    [
      "null content",
      (v) => {
        v.content = null;
        return v;
      },
      "content",
    ],
    [
      "array policy",
      (v) => {
        v.policy = [];
        return v;
      },
      "policy",
    ],
    [
      "null colors",
      (v) => {
        v.brand.colors = null;
        return v;
      },
      "brand.colors",
    ],
    [
      "null logo",
      (v) => {
        v.brand.logo = null;
        return v;
      },
      "brand.logo",
    ],
    [
      "null action",
      (v) => {
        v.content.action = null;
        return v;
      },
      "content.action",
    ],
    [
      "null verification",
      (v) => {
        v.content.verification = null;
        return v;
      },
      "content.verification",
    ],
    [
      "string introduction",
      (v) => {
        v.content.introduction = "Paragraph";
        return v;
      },
      "content.introduction",
    ],
    [
      "null introduction item",
      (v) => {
        v.content.introduction = [null];
        return v;
      },
      "content.introduction",
    ],
    [
      "null safety",
      (v) => {
        v.content.safety = null;
        return v;
      },
      "content.safety",
    ],
    [
      "object footer",
      (v) => {
        v.content.footer = { text: "Footer" };
        return v;
      },
      "content.footer",
    ],
    [
      "object details",
      (v) => {
        v.content.details = { label: "Label", value: "Value" };
        return v;
      },
      "content.details",
    ],
    [
      "null detail item",
      (v) => {
        v.content.details = [null];
        return v;
      },
      "content.details",
    ],
    [
      "missing action origins",
      (v) => {
        delete v.policy.allowedActionOrigins;
        return v;
      },
      "policy.allowedActionOrigins",
    ],
    [
      "string action origins",
      (v) => {
        v.policy.allowedActionOrigins = "https://account.example.test";
        return v;
      },
      "policy.allowedActionOrigins",
    ],
    [
      "null action origin",
      (v) => {
        v.policy.allowedActionOrigins = [null];
        return v;
      },
      "policy.allowedActionOrigins",
    ],
    [
      "null asset origins",
      (v) => {
        v.policy.allowedAssetOrigins = null;
        return v;
      },
      "policy.allowedAssetOrigins",
    ],
  ];
  for (const [name, mutate, field] of cases) {
    await t.test(name, () => expectInvalid(mutate(input()), field));
  }
});

test("automatic action text colors remain readable on light and dark primary colors", () => {
  for (const [primary, expected] of [
    ["#ffffff", "rgb(0, 0, 0)"],
    ["#000000", "rgb(255, 255, 255)"],
  ]) {
    const value = completeInput();
    value.brand.colors.primary = primary;
    const dom = document(renderEmail(value).html);
    const link = [...dom.querySelectorAll("a")].find(
      (element) => element.textContent === "Confirm account",
    );
    assert.ok(link);
    assert.equal(dom.defaultView.getComputedStyle(link).color, expected);
  }
});

test("explicit unreadable text colors are rejected instead of silently producing inaccessible mail", async (t) => {
  const cases = [
    ["onPrimary", { primary: "#ffffff", onPrimary: "#ffffff" }],
    ["text", { primary: "#2457d6", text: "#ffffff", surface: "#ffffff" }],
    ["heading", { primary: "#2457d6", heading: "#ffffff", surface: "#ffffff" }],
    ["muted", { primary: "#2457d6", muted: "#ffffff", surface: "#ffffff" }],
  ];
  for (const [field, colors] of cases) {
    await t.test(field, () => {
      const value = completeInput();
      value.brand.colors = colors;
      expectInvalid(value, `brand.colors.${field}`);
    });
  }
  const value = completeInput();
  value.brand.colors = { primary: "#ffffff", onPrimary: "#000000" };
  assert.equal(typeof renderEmail(value).html, "string");
});
