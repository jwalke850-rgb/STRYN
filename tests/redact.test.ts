import { test } from "node:test";
import assert from "node:assert/strict";
import { identifyingTerms, leaks, redact } from "../src/lib/redact.ts";
import type { Client } from "../src/lib/types.ts";

const client = (over: Partial<Client>): Client =>
  ({ id: "1", name: "Dana Whitfield", company: "Northline Freight", aliases: ["Project Falcon"], ...over }) as Client;

test("redacts client names, name parts, companies and aliases", () => {
  const terms = identifyingTerms([client({})]);
  const out = redact("Dana Whitfield said Northline's Project Falcon slipped. Dana was frustrated. Whitfield agreed.", terms);
  assert.equal(out, "[CLIENT] said [COMPANY] [REDACTED] slipped. [CLIENT] was frustrated. [CLIENT] agreed.");
});

test("redacts emails, phones, urls and amounts", () => {
  const out = redact("Email dana@northline.com or +44 20 7946 0958, see https://x.io/a — $2.5m deal", []);
  assert.equal(out, "Email [EMAIL] or [PHONE], see [URL] — [AMOUNT] deal");
});

test("does not redact inside other words", () => {
  const terms = identifyingTerms([client({ name: "Ann Lee", company: null })]);
  assert.equal(redact("Annual planning with Ann, ann", terms), "Annual planning with [CLIENT], ann");
});

test("flags leaked names in generated text", () => {
  const terms = identifyingTerms([client({})]);
  assert.deepEqual(leaks("A founder called Dana built a freight business", terms), ["Dana"]);
  assert.deepEqual(leaks("A founder built a business", terms), []);
});
