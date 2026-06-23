#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const source = join(repoRoot, "skills", "glassview");
const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const target = join(codexHome, "skills", "glassview");

if (!existsSync(source)) {
  console.error(`Skill source not found: ${source}`);
  process.exit(1);
}

await mkdir(dirname(target), { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });

console.log(`Installed Glassview skill to ${target}`);
