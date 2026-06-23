# Security

Glassview is intended for visual proof links. By default, screenshots are encrypted before upload, expire, and decrypt in the browser with a URL-fragment key.

## Token Handling

- Keep `GLASSVIEW_UPLOAD_TOKEN` secret.
- Do not commit `.env.local`, Alchemy state, Cloudflare credentials, tokens, screenshots, or private keys.
- Rotate the upload token if it is exposed.
- Prefer a dedicated Cloudflare API token scoped to the account/resources needed by Alchemy.

## Private Links

Private links are still bearer links: anyone with the full URL, including `#k=...`, can view the screenshot until it expires or is revoked. The Worker, R2 bucket, Cloudflare logs, and normal HTTP request logs do not receive the fragment key, so stored screenshot bytes are ciphertext.

Defaults:

- `GLASSVIEW_SHARE_MODE=private`
- `GLASSVIEW_DEFAULT_TTL=7d`
- `GLASSVIEW_MAX_TTL=30d`
- `GLASSVIEW_ENABLE_LATEST=false`
- `GLASSVIEW_ENCRYPT_UPLOADS=true`

Private mode omits plaintext labels, source URLs, app names, viewport values, and notes from stored metadata.

## Public Mode

Use `--public` only for screenshots that are safe to store as plaintext and share as public-by-link content. Public mode returns `rawUrl`.

## Team Mode

`GLASSVIEW_SHARE_MODE=team` is reserved for deployments that put Cloudflare Access or equivalent team controls in front of the Worker. It is intentionally not the default because it adds recipient login friction.

## Repository Guardrails

Run local checks before publishing changes:

```bash
pnpm security:check
```

Optional local git hooks:

```bash
pnpm hooks:install
```

The repo includes:

- forbidden staged-file guardrails in `.forbidden-paths.regex`
- BetterLeaks configuration in `.betterleaks.toml`
- a local security check script in `scripts/secleak-check.sh`
- GitHub Actions secret scanning
- Dependabot for npm and GitHub Actions
