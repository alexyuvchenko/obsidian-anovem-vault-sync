import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAppKey } from "./app-key";

test("an app key is the first 15-character token", () => {
  assert.equal(normalizeAppKey(" abcdefghijklmno "), "abcdefghijklmno");
  assert.equal(normalizeAppKey("abcdefghijklmno\npqrstuvwxyz0123"), "abcdefghijklmno");
});

test("a long token is rejected", () => {
  assert.throws(() => normalizeAppKey("sl.a-very-long-generated-access-token-value"));
});
