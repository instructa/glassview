# Security

Glassview is intended for visual proof links. Treat every uploaded screenshot as shareable with anyone who has the URL.

## Token Handling

- Keep `GLASSVIEW_UPLOAD_TOKEN` secret.
- Do not commit `.env.local`, Alchemy state, Cloudflare credentials, tokens, screenshots, or private keys.
- Rotate the upload token if it is exposed.
- Prefer a dedicated Cloudflare API token scoped to the account/resources needed by Alchemy.

## Public Reads

Screenshot viewer URLs are unguessable but public. Do not upload private customer data, credentials, tokens, or sensitive internal screens unless that sharing model is acceptable.

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
