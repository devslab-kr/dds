import assert from "node:assert/strict";
import test from "node:test";
import { buildPublisher, definePublisher, renderPublisherHtml, serializeJsonLd } from "../packages/site-kit/src/core/index.mjs";
import { DEVSLAB_PUBLISHER } from "../packages/site-kit/src/core/devslab.mjs";

test("one publisher identity supplies the organization, reference and localized link", () => {
  const publisher = buildPublisher(DEVSLAB_PUBLISHER, { locale: "ko" });
  assert.equal(publisher.organization.name, "DevsLab");
  assert.equal(publisher.organization.alternateName, "데브스랩");
  assert.equal(publisher.organization["@id"], "https://devslab.kr/#organization");
  assert.equal(publisher.reference["@id"], publisher.organization["@id"]);
  assert.equal(publisher.link.href, publisher.organization.url);
  assert.equal(publisher.link.label, "데브스랩(DevsLab)");
  assert.equal(buildPublisher(DEVSLAB_PUBLISHER).link.label, "데브스랩(DevsLab)");
  assert.equal(buildPublisher(DEVSLAB_PUBLISHER, { locale: "en" }).link.label, "DevsLab");
  assert.equal(buildPublisher(DEVSLAB_PUBLISHER, { locale: "ko-KR" }).link.label, "데브스랩(DevsLab)");
  assert.equal(buildPublisher(DEVSLAB_PUBLISHER, { locale: "constructor" }).link.label, "데브스랩(DevsLab)");
  for (const locale of ["toString", "__proto__"]) assert.equal(buildPublisher(DEVSLAB_PUBLISHER, { locale }).link.label, "데브스랩(DevsLab)");
  assert.deepEqual(publisher.organization.sameAs, ["https://github.com/devslab-kr", "https://devslab-kr.github.io/"]);
  assert.doesNotMatch(JSON.stringify(publisher.organization), /description|rating|offers|contactPoint/);
});

test("generic publisher config is copied, validated and immutable", () => {
  const input = { id: "https://example.com/#org", name: "Example", url: "https://example.com/", alternateName: ["예제"], sameAs: ["https://example.org/"], labels: { ko: "예제" } };
  const identity = definePublisher(input);
  input.labels.ko = "Changed";
  input.alternateName.push("Changed");
  input.sameAs.push("https://changed.example/");
  assert.equal(buildPublisher(identity, { locale: "ko" }).link.label, "예제");
  assert.deepEqual(identity.alternateName, ["예제"]);
  assert.ok(Object.isFrozen(identity));
  assert.ok(Object.isFrozen(identity.labels));
  assert.ok(Object.isFrozen(identity.alternateName));
  assert.deepEqual(identity.sameAs, ["https://example.org/"]);
  assert.ok(Object.isFrozen(identity.sameAs));
  assert.equal(buildPublisher(identity, { locale: "fr" }).link.label, "Example");
  for (const url of ["javascript:alert(1)", "data:text/html,foo", "/relative", "https://user:password@example.com/"]) {
    assert.throws(() => definePublisher({ ...input, url }), /URL/);
    assert.throws(() => definePublisher({ ...input, id: url }), /URL/);
    assert.throws(() => definePublisher({ ...input, sameAs: [url] }), /URL/);
  }
  assert.throws(() => definePublisher({ ...input, name: " " }), /name/);
  assert.throws(() => definePublisher({ ...input, labels: { ko: "" } }), /label/);
});

test("static HTML escapes attributes and JSON-LD script terminators without changing data", () => {
  const identity = definePublisher({ id: "https://example.com/#org", name: '</script><script>alert("x")</script>', url: "https://example.com/?a=1&b=2", defaultLabel: '<Company & "friends">' });
  const html = renderPublisherHtml(identity, { nonce: 'test" onload="alert(1)' });
  assert.match(html, /href="https:\/\/example.com\/\?a=1&amp;b=2"/);
  assert.match(html, /&lt;Company &amp; &quot;friends&quot;&gt;/);
  assert.match(html, /nonce="test&quot; onload=&quot;alert\(1\)"/);
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
  const json = html.match(/<script[^>]*>([\s\S]*)<\/script>/)[1];
  assert.equal(JSON.parse(json).name, identity.name);
  const dangerous = { text: "</script>\u2028\u2029&" };
  assert.deepEqual(JSON.parse(serializeJsonLd(dangerous)), dangerous);
  assert.doesNotMatch(serializeJsonLd(dangerous), /[<\u2028\u2029]/u);
});
