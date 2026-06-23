#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const apiResponsePath = join(
  process.cwd(),
  "node_modules/alchemy/lib/cloudflare/api-response.js",
);
let source = await readFile(apiResponsePath, "utf8");

if (!source.includes('from "node:zlib"')) {
  source = `import { gunzipSync } from "node:zlib";\n${source}`;
}

const original = `    const json = (await response.json().catch(() => {
        throw new Error(\`Failed to \${label} (\${response.status}): The API returned an invalid response\`);
    }));`;

const statusOnlyPatch = `    const json = (await response.json().catch(() => {
        const error = new Error(\`Failed to \${label} (\${response.status}): The API returned an invalid response\`);
        Object.assign(error, {
            status: response.status,
            statusText: response.statusText,
            response,
        });
        throw error;
    }));`;

const patched = `    const json = (await response.clone().json().catch(async () => {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            try {
                return JSON.parse(gunzipSync(buffer).toString("utf8"));
            }
            catch {
            }
        }
        if (response.ok) {
            return { success: true, result: {} };
        }
        const error = new Error(\`Failed to \${label} (\${response.status}): The API returned an invalid response\`);
        Object.assign(error, {
            status: response.status,
            statusText: response.statusText,
            response,
        });
        throw error;
    }));`;

if (!source.includes(patched)) {
  const clonedEmptySuccessPatch = patched
    .replace(`        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            try {
                return JSON.parse(gunzipSync(buffer).toString("utf8"));
            }
            catch {
            }
        }
`, "")
    .replace("response.clone().json().catch(async () =>", "response.json().catch(() =>");
  const emptySuccessPatch = patched.replace(
    "return { success: true, result: {} };",
    "return {};",
  );
  const target = source.includes(emptySuccessPatch)
    ? emptySuccessPatch
    : source.includes(clonedEmptySuccessPatch)
      ? clonedEmptySuccessPatch
    : source.includes(statusOnlyPatch)
      ? statusOnlyPatch
      : original;

  if (source.includes(target)) {
    source = source.replace(target, patched);
  } else {
    console.warn("Alchemy Cloudflare response parser patch was not applied: target block not found.");
  }
}

source = source
  .replaceAll("json.errors.map", "(json.errors ?? []).map")
  .replaceAll("response, json.errors);", "response, json.errors ?? []);");

await writeFile(apiResponsePath, source);
console.log("Patched Alchemy Cloudflare response parser.");
