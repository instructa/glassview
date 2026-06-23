#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const envFile = ".env.local";

if (!existsSync(envFile)) {
  const stage = process.env.STAGE || "prod";
  const slug = process.env.GLASSVIEW_BUCKET_SLUG || randomBytes(3).toString("hex");
  const bucketName =
    process.env.GLASSVIEW_BUCKET_NAME || `glassview-${stage}-${slug}-screenshots`;
  const values = {
    ALCHEMY_PASSWORD: process.env.ALCHEMY_PASSWORD || randomSecret(32),
    GLASSVIEW_UPLOAD_TOKEN: process.env.GLASSVIEW_UPLOAD_TOKEN || randomSecret(48),
    GLASSVIEW_BUCKET_NAME: bucketName,
    GLASSVIEW_USE_EXISTING_R2: process.env.GLASSVIEW_USE_EXISTING_R2 || "false",
    GLASSVIEW_ENABLE_WORKERS_DEV: process.env.GLASSVIEW_ENABLE_WORKERS_DEV || "true",
    STAGE: stage,
  };

  const body = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  await writeFile(envFile, `${body}\n`, { mode: 0o600 });
  console.log(`Created ${envFile} with generated secrets.`);
} else {
  console.log(`Using existing ${envFile}.`);
}

console.log("Deploying Glassview with Alchemy...");
const child = spawn("pnpm", ["exec", "alchemy", "deploy", "--env-file", envFile], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Deploy interrupted by ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

function randomSecret(bytes) {
  return randomBytes(bytes).toString("hex");
}
