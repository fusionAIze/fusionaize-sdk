#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const PACKAGES_DIR = path.join(ROOT, "packages");
const CHANGESETS_DIR = path.join(ROOT, ".changeset");

function readPackageJson(pkgDir) {
  const file = path.join(pkgDir, "package.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`Failed to read ${file}: ${err.message}`);
  }
}

function validatePackage(pkg, pkgDir) {
  const warnings = [];
  const errors = [];

  // Check CHANGELOG.md exists
  const changelogPath = path.join(pkgDir, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    errors.push("Missing CHANGELOG.md");
  } else {
    const content = fs.readFileSync(changelogPath, "utf8");
    // Ensure there's at least a placeholder
    if (!content.includes("# Changelog")) {
      warnings.push("CHANGELOG.md may not follow expected format");
    }
  }

  // Check version is valid semver
  const version = pkg.version;
  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)) {
    errors.push(`Version "${version}" is not valid semver`);
  }

  // Check that package is not private (should not be for publishable packages)
  if (pkg.private) {
    warnings.push("Package is marked private, will not be published");
  }

  return { warnings, errors };
}

function checkChangesets() {
  if (!fs.existsSync(CHANGESETS_DIR)) {
    return { warnings: ["No .changeset directory"], errors: [] };
  }

  const changesetFiles = fs
    .readdirSync(CHANGESETS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md");

  if (changesetFiles.length === 0) {
    return { warnings: ["No changeset files found"], errors: [] };
  }

  return { warnings: [], errors: [] };
}

function main() {
  console.log("🔍 Verifying release state...");

  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .filter((entry) => fs.statSync(path.join(PACKAGES_DIR, entry)).isDirectory());

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const pkgDir of packages) {
    const fullDir = path.join(PACKAGES_DIR, pkgDir);
    const pkg = readPackageJson(fullDir);
    const { warnings, errors } = validatePackage(pkg, fullDir);

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n📦 ${pkg.name}:`);
      for (const err of errors) {
        console.error(`   ❌ ${err}`);
        totalErrors++;
      }
      for (const warn of warnings) {
        console.warn(`   ⚠️  ${warn}`);
        totalWarnings++;
      }
    }
  }

  const changesetResult = checkChangesets();
  if (changesetResult.errors.length > 0) {
    console.error("\n❌ Changeset errors:");
    for (const err of changesetResult.errors) {
      console.error(`   ${err}`);
      totalErrors++;
    }
  }
  if (changesetResult.warnings.length > 0) {
    console.warn("\n⚠️  Changeset warnings:");
    for (const warn of changesetResult.warnings) {
      console.warn(`   ${warn}`);
      totalWarnings++;
    }
  }

  console.log(`\n📊 Summary: ${totalErrors} errors, ${totalWarnings} warnings`);

  if (totalErrors > 0) {
    console.error("💥 Release state verification failed.");
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.warn("⚠️  Release state has warnings but may proceed.");
  } else {
    console.log("✅ Release state verified successfully.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
