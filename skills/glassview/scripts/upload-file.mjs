#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

const file = process.argv[2];

if (!file) {
  console.error("Usage: node upload-file.mjs <image-file> [label]");
  process.exit(2);
}

const baseUrl = process.env.GLASSVIEW_URL || process.env.GLASSVIEW_LOCAL_URL;
const token = process.env.GLASSVIEW_UPLOAD_TOKEN;

if (!baseUrl) {
  console.error("Missing GLASSVIEW_URL or GLASSVIEW_LOCAL_URL.");
  process.exit(2);
}

if (!token) {
  console.error("Missing GLASSVIEW_UPLOAD_TOKEN.");
  process.exit(2);
}

const info = await stat(file);
if (!info.isFile()) {
  console.error(`${file} is not a file.`);
  process.exit(2);
}

const bytes = await readFile(file);
const label = process.argv[3] || basename(file);
const url = new URL("/api/screenshots", baseUrl);
url.searchParams.set("label", label);

const response = await fetch(url, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": contentTypeFor(file),
  },
  body: bytes,
});

const text = await response.text();
if (!response.ok) {
  console.error(`Upload failed: ${response.status} ${response.statusText}`);
  console.error(text);
  process.exit(1);
}

const result = JSON.parse(text);
console.log(result.viewUrl);

function contentTypeFor(path) {
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}
