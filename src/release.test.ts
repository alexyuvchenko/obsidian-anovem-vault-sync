import assert from "node:assert/strict";
import test from "node:test";
import { parseLatestRelease } from "./release";

test("a newer GitHub release lists the plugin files", () => {
  const plan = parseLatestRelease({
    tag_name: "v0.2.0",
    assets: [
      { name: "main.js", browser_download_url: "https://github.com/example/main.js" },
      { name: "styles.css", browser_download_url: "https://github.com/example/styles.css" },
      { name: "manifest.json", browser_download_url: "https://github.com/example/manifest.json" },
    ],
  }, "0.1.0");
  assert.equal(plan?.version, "0.2.0");
  assert.equal(plan?.files["main.js"], "https://github.com/example/main.js");
});

test("the current release is not installed again", () => {
  assert.equal(parseLatestRelease({
    tag_name: "v0.1.0",
    assets: [],
  }, "0.1.0"), null);
});
