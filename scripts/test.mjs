import esbuild from "esbuild";
import { spawn } from "node:child_process";

await esbuild.build({
  entryPoints: ["src/plan.test.ts", "src/paths.test.ts", "src/archive.test.ts", "src/app-key.test.ts", "src/merge.test.ts", "src/release.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: "dist-test",
  outExtension: { ".js": ".mjs" },
  external: ["node:test", "node:assert", "node:assert/strict"],
});

const child = spawn(process.execPath, ["--test", "dist-test/plan.test.mjs", "dist-test/paths.test.mjs", "dist-test/archive.test.mjs", "dist-test/app-key.test.mjs", "dist-test/merge.test.mjs", "dist-test/release.test.mjs", "scripts/version.test.mjs"], {
  stdio: "inherit",
});
const code = await new Promise((resolve) => child.on("close", resolve));
process.exit(code ?? 1);
