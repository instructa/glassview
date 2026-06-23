#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

function loadForbiddenPatterns() {
  const patternsFile = join(projectRoot, ".forbidden-paths.regex");
  if (!existsSync(patternsFile)) return [];

  return readFileSync(patternsFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((pattern) => new RegExp(pattern));
}

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: projectRoot,
      encoding: "utf8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const forbidden = [];
for (const file of getStagedFiles()) {
  const pattern = loadForbiddenPatterns().find((candidate) => candidate.test(file));
  if (pattern) forbidden.push({ file, pattern: pattern.source });
}

if (forbidden.length > 0) {
  console.error("Forbidden files detected in staging area:");
  for (const { file, pattern } of forbidden) {
    console.error(`- ${file}`);
    console.error(`  Pattern: ${pattern}`);
  }
  console.error("Fix: git reset HEAD <file> and update .gitignore if needed.");
  process.exit(1);
}

console.log("No forbidden files in staging area");
