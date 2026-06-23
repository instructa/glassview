import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "@playwright/test";
import { handleRequest } from "../src/app";
import type { GlassviewEnv, ScreenshotMetadata } from "../src/types";
import { MemoryR2Bucket } from "./memory-r2";

const UPLOAD_TOKEN = "private-flow-token";
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

describe("private encrypted sharing flow", () => {
  let bucket: MemoryR2Bucket;
  let env: GlassviewEnv;
  let origin: string;
  let closeServer: () => Promise<void>;
  let browser: Browser;

  beforeAll(async () => {
    bucket = new MemoryR2Bucket();
    env = {
      SCREENSHOTS: bucket as unknown as R2Bucket,
      GLASSVIEW_UPLOAD_TOKEN: UPLOAD_TOKEN,
    };

    const server = createServer((request, response) => {
      void respondWithWorker(request, response, env);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Could not start test server");
    origin = `http://127.0.0.1:${address.port}`;
    closeServer = () => new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
    await closeServer?.();
  });

  it("uploads ciphertext, decrypts in browser, expires, revokes, and locks latest", async () => {
    const viewUrl = await uploadWithCli("proof.png");
    expect(viewUrl).toMatch(/\/v\/[a-f0-9]{32}#k=[A-Za-z0-9_-]+$/);

    const id = new URL(viewUrl).pathname.split("/").pop()!;
    const meta = await getMeta(id);
    expect(meta.mode).toBe("encrypted");
    expect(meta.rawUrl).toBeUndefined();
    expect(meta.blobUrl).toBe(`${origin}/blob/${id}`);
    expect(meta.cipher?.alg).toBe("AES-GCM");
    expect(meta.expiresAt).toBeDefined();

    const stored = await bucket.get(meta.imageKey);
    expect(stored?.httpMetadata?.contentType).toBe("application/octet-stream");
    expect(Buffer.compare(Buffer.from(await stored!.arrayBuffer()), PNG_BYTES)).not.toBe(0);

    const page = await browser.newPage();
    try {
      await page.goto(viewUrl, { waitUntil: "domcontentloaded" });
      await page.locator("figure img").waitFor({ state: "visible" });
      const imageReady = await page.locator("figure img").evaluate((image) => {
        const img = image as { complete: boolean; naturalWidth: number; src: string };
        return img.complete && img.naturalWidth > 0 && img.src.startsWith("blob:");
      });
      expect(imageReady).toBe(true);
      expect(await page.locator("[data-download]").isVisible()).toBe(true);
    } finally {
      await page.close();
    }

    const latestPublic = await fetch(`${origin}/latest`, { redirect: "manual" });
    expect(latestPublic.status).toBe(401);

    const latestAuthorized = await fetch(`${origin}/latest`, {
      headers: { authorization: `Bearer ${UPLOAD_TOKEN}` },
      redirect: "manual",
    });
    expect(latestAuthorized.status).toBe(302);
    expect(latestAuthorized.headers.get("location")).toBe(`${origin}/v/${id}`);

    await updateMeta(id, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect((await fetch(`${origin}/v/${id}`)).status).toBe(410);
    expect((await fetch(`${origin}/blob/${id}`)).status).toBe(410);

    const revokeUrl = await uploadWithCli("revoke.png");
    const revokeId = new URL(revokeUrl).pathname.split("/").pop()!;
    const revoke = await fetch(`${origin}/api/screenshots/${revokeId}/revoke`, {
      method: "POST",
      headers: { authorization: `Bearer ${UPLOAD_TOKEN}` },
    });
    expect(revoke.status).toBe(200);
    expect((await getMeta(revokeId)).revokedAt).toBeDefined();
    expect((await fetch(`${origin}/v/${revokeId}`)).status).toBe(410);
    expect((await fetch(`${origin}/blob/${revokeId}`)).status).toBe(410);
  }, 30_000);

  async function uploadWithCli(name: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "glassview-private-flow-"));
    const file = join(dir, name);
    await writeFile(file, PNG_BYTES);

    const child = spawn(process.execPath, ["scripts/upload-file.mjs", file, "--ttl", "24h"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GLASSVIEW_URL: origin,
        GLASSVIEW_UPLOAD_TOKEN: UPLOAD_TOKEN,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    const code = await new Promise<number | null>((resolve) => child.on("close", resolve));
    if (code !== 0) throw new Error(`upload-file failed: ${stderr}`);
    return stdout.trim();
  }

  async function getMeta(id: string): Promise<ScreenshotMetadata> {
    const object = await bucket.get(`meta/${id}.json`);
    if (!object) throw new Error(`missing metadata for ${id}`);
    return object.json<ScreenshotMetadata>();
  }

  async function updateMeta(id: string, patch: Partial<ScreenshotMetadata>): Promise<void> {
    const meta = await getMeta(id);
    await bucket.put(`meta/${id}.json`, JSON.stringify({ ...meta, ...patch }, null, 2), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
  }
});

async function respondWithWorker(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
  env: GlassviewEnv,
): Promise<void> {
  try {
    const body = incoming.method === "GET" || incoming.method === "HEAD"
      ? undefined
      : await readIncomingBody(incoming);
    const requestBody = body ? (Uint8Array.from(body).buffer as ArrayBuffer) : undefined;
    const request = new Request(`http://${incoming.headers.host}${incoming.url || "/"}`, {
      method: incoming.method,
      headers: incoming.headers as HeadersInit,
      body: requestBody,
    });
    const response = await handleRequest(request, env);
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    outgoing.writeHead(response.status, headers);
    if (incoming.method === "HEAD") {
      outgoing.end();
      return;
    }
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end(error instanceof Error ? error.stack : String(error));
  }
}

async function readIncomingBody(incoming: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
