# Testing

Run the main verification commands:

```bash
pnpm build
pnpm test
pnpm verify:private
pnpm security:check
```

`pnpm build` runs TypeScript type checking.

`pnpm test` runs the Worker unit tests with an in-memory R2 implementation.

`pnpm verify:private` runs the end-to-end private sharing smoke test. It starts a local Worker-backed HTTP server, uploads through the CLI, verifies the stored bytes are ciphertext, opens the viewer in Playwright, confirms browser-side decrypt renders an image, checks expiry and revocation return `410 Gone`, and checks `/latest` is not public by default.

`pnpm security:check` runs local leak and dependency checks when the required tools are installed.

Before claiming a private Glassview proof works, upload a real image and verify the returned viewer URL includes `#k=...`, returns `200 OK`, and decrypts in a browser.
