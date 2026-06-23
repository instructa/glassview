import type { ScreenshotMetadata } from "./types";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderHome(latest?: ScreenshotMetadata): string {
  const latestLink = latest
    ? `<a class="button" href="${escapeHtml(latest.viewUrl)}">Open latest screenshot</a>`
    : `<p class="muted">No screenshots have been uploaded yet.</p>`;

  return page("Glassview", `
    <main class="shell">
      <h1>Glassview</h1>
      <p>Remote screenshot links for agent work.</p>
      ${latestLink}
    </main>
  `);
}

export function renderViewer(meta: ScreenshotMetadata): string {
  const assetUrl = meta.rawUrl || meta.blobUrl || "#";
  const buttonLabel = meta.mode === "encrypted" ? "Open blob" : "Open raw";
  const rows = [
    ["Created", meta.createdAt],
    ["Label", meta.label],
    ["Source", meta.sourceUrl],
    ["App", meta.appName],
    ["Viewport", meta.viewport],
    ["Note", meta.note],
    ["Content type", meta.contentType],
    ["Size", `${meta.size} bytes`],
  ].filter(([, value]) => value);

  return page(`Glassview ${meta.id}`, `
    <main class="viewer">
      <header>
        <div>
          <p class="eyebrow">Glassview</p>
          <h1>${escapeHtml(meta.label || meta.id)}</h1>
        </div>
        <a class="button" href="${escapeHtml(assetUrl)}">${buttonLabel}</a>
      </header>
      <figure>
        <img src="${escapeHtml(assetUrl)}" alt="${escapeHtml(meta.label || "Uploaded screenshot")}" />
      </figure>
      <dl>
        ${rows
          .map(([label, value]) => `
            <div>
              <dt>${escapeHtml(label || "")}</dt>
              <dd>${escapeHtml(value || "")}</dd>
            </div>
          `)
          .join("")}
      </dl>
    </main>
  `);
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #101214;
      color: #f4f1ec;
    }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(31, 35, 39, 0.96), rgba(12, 14, 16, 1));
    }
    .shell, .viewer {
      width: min(1120px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 40px 0;
    }
    .shell {
      min-height: calc(100vh - 80px);
      display: grid;
      align-content: center;
      gap: 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: end;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      font-size: clamp(32px, 5vw, 64px);
      line-height: 1;
      letter-spacing: 0;
    }
    p {
      color: #c8c0b6;
      max-width: 64ch;
    }
    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.14em;
      color: #8fd3ff;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
      color: #061014;
      background: #8fd3ff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
    }
    figure {
      margin: 0;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: #050607;
      overflow: auto;
      border-radius: 8px;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin: 20px 0 0;
    }
    dl div {
      border-top: 1px solid rgba(255, 255, 255, 0.16);
      padding-top: 10px;
      overflow-wrap: anywhere;
    }
    dt {
      color: #8fd3ff;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    dd {
      margin: 0;
      color: #f4f1ec;
    }
    .muted {
      color: #948a80;
    }
    @media (max-width: 640px) {
      header {
        align-items: start;
        flex-direction: column;
      }
      .button {
        width: 100%;
      }
    }
  </style>
</head>
<body>${body}</body>
</html>`;
}
