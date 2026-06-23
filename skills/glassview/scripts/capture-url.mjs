#!/usr/bin/env node
import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const targetUrl = process.argv[2];
const label = process.argv[3] || targetUrl;

if (!targetUrl) {
  console.error("Usage: node capture-url.mjs <url> [label]");
  process.exit(2);
}

const dir = await mkdtemp(join(tmpdir(), "glassview-"));
await mkdir(dir, { recursive: true });
const screenshotPath = join(dir, "screenshot.png");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: screenshotPath, fullPage: true });
} finally {
  await browser.close();
}

const result = spawnSync(
  process.execPath,
  [new URL("./upload-file.mjs", import.meta.url).pathname, screenshotPath, label],
  { stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
