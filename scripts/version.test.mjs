import assert from "node:assert/strict";
import test from "node:test";
import { checkVersions } from "./version.mjs";

const current = {
  manifestVersion: "0.1.0",
  packageVersion: "0.1.0",
  minAppVersion: "1.5.0",
  versions: { "0.1.0": "1.5.0" },
};

test("tag v0.1.0 matches the version in code", () => {
  assert.deepEqual(checkVersions({ ...current, tag: "v0.1.0" }), []);
});

test("versions.json must list the same version", () => {
  const problems = checkVersions({ ...current, versions: {} });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /versions\.json/);
});

test("a different tag is rejected", () => {
  const problems = checkVersions({ ...current, tag: "v0.2.0" });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /v0\.1\.0/);
});
