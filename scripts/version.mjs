import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url);

export function checkVersions({ tag, manifestVersion, packageVersion, minAppVersion, versions }) {
  const problems = [];
  if (!/^\d+\.\d+\.\d+$/.test(manifestVersion)) {
    problems.push(`manifest.json version must be major.minor.patch, not ${manifestVersion}.`);
  }
  if (packageVersion !== manifestVersion) {
    problems.push(`package.json is ${packageVersion}; manifest.json is ${manifestVersion}.`);
  }
  if (versions[manifestVersion] !== minAppVersion) {
    problems.push(`versions.json must contain "${manifestVersion}": "${minAppVersion}".`);
  }
  if (tag !== undefined && tag !== `v${manifestVersion}`) {
    problems.push(`Tag ${tag} must be v${manifestVersion}, the version in manifest.json, package.json, and versions.json.`);
  }
  return problems;
}

export function readVersions() {
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const versions = JSON.parse(readFileSync(new URL("versions.json", root), "utf8"));
  return {
    manifestVersion: manifest.version,
    packageVersion: pkg.version,
    minAppVersion: manifest.minAppVersion,
    versions,
  };
}

function writeVersion(next) {
  if (!/^\d+\.\d+\.\d+$/.test(next)) {
    throw new Error(`Version must be major.minor.patch, not ${next}.`);
  }
  const manifestUrl = new URL("manifest.json", root);
  const packageUrl = new URL("package.json", root);
  const versionsUrl = new URL("versions.json", root);
  const lockUrl = new URL("package-lock.json", root);
  const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  const pkg = JSON.parse(readFileSync(packageUrl, "utf8"));
  const versions = JSON.parse(readFileSync(versionsUrl, "utf8"));
  manifest.version = next;
  pkg.version = next;
  versions[next] = manifest.minAppVersion;
  writeFileSync(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(packageUrl, `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(versionsUrl, `${JSON.stringify(versions, null, 2)}\n`);
  const lock = readFileSync(lockUrl, "utf8");
  writeFileSync(lockUrl, replaceLockVersion(lock, next));
}

export function replaceLockVersion(lock, next) {
  const parsed = JSON.parse(lock);
  const rootVersion = parsed.version;
  const packageVersion = parsed.packages?.[""]?.version;
  if (typeof rootVersion !== "string" || typeof packageVersion !== "string") {
    throw new Error("package-lock.json has no root version.");
  }
  const updated = lock
    .replace(`"name": "vault-anovem-sync",\n  "version": "${rootVersion}"`, `"name": "vault-anovem-sync",\n  "version": "${next}"`)
    .replace(`"name": "vault-anovem-sync",\n      "version": "${packageVersion}"`, `"name": "vault-anovem-sync",\n      "version": "${next}"`);
  if (!updated.includes(`"name": "vault-anovem-sync",\n  "version": "${next}"`) || !updated.includes(`"name": "vault-anovem-sync",\n      "version": "${next}"`)) {
    throw new Error("package-lock.json version was not updated.");
  }
  return updated;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const arg = process.argv[2];
if (!invoked) {
  // imported by tests
} else if (arg === undefined) {
  const problems = checkVersions(readVersions());
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const { manifestVersion } = readVersions();
  console.log(`v${manifestVersion}`);
} else if (arg === "--check") {
  const tag = process.argv[3];
  if (!tag) throw new Error("Usage: node scripts/version.mjs --check v0.1.0");
  const problems = checkVersions({ ...readVersions(), tag });
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`${tag} matches manifest.json, package.json, and versions.json`);
} else {
  writeVersion(arg);
  console.log(`Version set to ${arg}. Tag the commit v${arg}.`);
}
