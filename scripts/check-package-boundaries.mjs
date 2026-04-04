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

function isFoundationPackage(name) {
  return name.startsWith("@fusionaize/sdk-");
}

function isGatePackage(name) {
  return name.startsWith("@fusionaize/gate-");
}

function categorizePackage(name) {
  if (isFoundationPackage(name)) return "foundation";
  if (isGatePackage(name)) return "gate";
  throw new Error(`Unknown package type: ${name}`);
}

function collectDependencies(pkg) {
  const deps = [];
  for (const dep of Object.keys(pkg.dependencies || {})) {
    if (pkg.dependencies[dep] === "workspace:*") {
      deps.push(dep);
    }
  }
  return deps;
}

function detectCycles(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    const newPath = [...path, node];

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, newPath);
      } else if (recursionStack.has(neighbor)) {
        cycles.push([...newPath, neighbor]);
      }
    }

    recursionStack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

function main() {
  console.log("🔍 Checking package dependency boundaries...");

  const packages = fs
    .readdirSync(PACKAGES_DIR)
    .filter((entry) => fs.statSync(path.join(PACKAGES_DIR, entry)).isDirectory());

  const pkgMap = new Map();
  const graph = {};
  const categories = {};

  for (const pkgDir of packages) {
    const pkg = readPackageJson(path.join(PACKAGES_DIR, pkgDir));
    pkgMap.set(pkg.name, pkg);
    categories[pkg.name] = categorizePackage(pkg.name);
    graph[pkg.name] = collectDependencies(pkg);
  }

  let hasError = false;

  // Rule 1: foundation packages cannot depend on gate packages
  for (const [pkgName, deps] of Object.entries(graph)) {
    if (categories[pkgName] === "foundation") {
      for (const dep of deps) {
        if (categories[dep] === "gate") {
          console.error(`❌ Foundation package ${pkgName} depends on gate package ${dep}`);
          hasError = true;
        }
      }
    }
  }

  // Rule 2: gate packages can depend on anything (foundation or gate)
  // No restriction needed

  // Rule 3: no circular dependencies
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    console.error("❌ Circular dependencies detected:");
    for (const cycle of cycles) {
      console.error(`   ${cycle.join(" → ")}`);
    }
    hasError = true;
  }

  // Optional: print dependency stats
  if (!hasError) {
    console.log("📦 Package categorization:");
    const foundation = Object.keys(categories).filter((k) => categories[k] === "foundation");
    const gate = Object.keys(categories).filter((k) => categories[k] === "gate");
    console.log(`   Foundation packages: ${foundation.length} (${foundation.join(", ")})`);
    console.log(`   Gate packages: ${gate.length} (${gate.join(", ")})`);
    console.log("✅ All package boundary checks passed!");
  } else {
    console.error("💥 Package boundary validation failed.");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
