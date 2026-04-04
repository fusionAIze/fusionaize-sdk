#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const PACKAGES_DIR = path.join(ROOT, "packages");

function readPackageJson(pkgDir) {
  const file = path.join(pkgDir, "package.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`Failed to read ${file}: ${err.message}`);
  }
}

function validateExports(pkg, pkgName) {
  const errors = [];

  if (!pkg.exports) {
    errors.push(`Missing "exports" field`);
    return errors;
  }

  const rootExport = pkg.exports["."];
  if (!rootExport) {
    errors.push(`Missing "." entry in exports`);
    return errors;
  }

  if (typeof rootExport === "string") {
    // Conditional exports shorthand, must match main/types
    if (pkg.main && rootExport !== pkg.main) {
      errors.push(`Root export string "${rootExport}" does not match main "${pkg.main}"`);
    }
    // Cannot validate types because string shorthand doesn't specify types
  } else if (typeof rootExport === "object") {
    if (!rootExport.import && !rootExport.default) {
      errors.push(`Root export missing "import" or "default"`);
    }
    if (!rootExport.types) {
      errors.push(`Root export missing "types"`);
    }
    if (pkg.main && rootExport.import && rootExport.import !== pkg.main) {
      errors.push(`Root export.import "${rootExport.import}" does not match main "${pkg.main}"`);
    }
    if (pkg.types && rootExport.types && rootExport.types !== pkg.types) {
      errors.push(`Root export.types "${rootExport.types}" does not match types "${pkg.types}"`);
    }
  } else {
    errors.push(`Root export must be string or object, got ${typeof rootExport}`);
  }

  // Ensure no extra top-level keys besides '.' unless we support subpath exports
  const exportKeys = Object.keys(pkg.exports);
  if (exportKeys.length > 1) {
    // Allow subpath exports, but warn if not './*' pattern
    const extra = exportKeys.filter((k) => k !== ".");
    for (const key of extra) {
      if (!key.startsWith("./")) {
        errors.push(`Export key "${key}" must start with "./"`);
      }
    }
  }

  return errors;
}

function main() {
  console.log("🔍 Checking package export maps...");

  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .filter((entry) => fs.statSync(path.join(PACKAGES_DIR, entry)).isDirectory());

  let hasError = false;

  for (const pkgDir of packages) {
    const pkg = readPackageJson(path.join(PACKAGES_DIR, pkgDir));
    const errors = validateExports(pkg, pkg.name);
    if (errors.length > 0) {
      console.error(`❌ ${pkg.name}:`);
      for (const err of errors) {
        console.error(`   - ${err}`);
      }
      hasError = true;
    }
  }

  if (!hasError) {
    console.log(`✅ All ${packages.length} packages have valid export maps.`);
  } else {
    console.error("💥 Export validation failed.");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
