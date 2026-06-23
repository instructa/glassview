#!/usr/bin/env node
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

if (!existsSync(".git")) {
  console.error("No .git directory found. Run this from a git checkout.");
  process.exit(1);
}

const hooksDir = join(".git", "hooks");
await mkdir(hooksDir, { recursive: true });

const hook = `#!/usr/bin/env sh
set -eu
node scripts/hooks/block-forbidden-staged-files.mjs
`;

for (const name of ["pre-commit", "pre-push"]) {
  const path = join(hooksDir, name);
  await writeFile(path, hook);
  await chmod(path, 0o755);
  console.log(`Installed ${path}`);
}
