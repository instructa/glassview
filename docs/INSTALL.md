# Install

Glassview is most useful when the skill is installed in your agent and pointed at a deployed Glassview service.

## Install With Agent Skills

Codex:

```bash
npx skills add regenrek/glassview --skill glassview --agent codex -g
```

Claude Code:

```bash
npx skills add regenrek/glassview --skill glassview --agent claude-code -g
```

List available skills in the repo:

```bash
npx skills add regenrek/glassview --list
```

Use `-g` for a global install. Omit it for a project-local install. Add `--copy` if you prefer copied files instead of symlinks.

## Clone-Based Install

```bash
git clone https://github.com/regenrek/glassview.git
cd glassview
pnpm install
pnpm skill:install
```

`pnpm skill:install` copies `skills/glassview` into `${CODEX_HOME:-$HOME/.codex}/skills/glassview`.

## Configure The Skill

Set the service URL and upload token in the shell or agent environment:

```bash
export GLASSVIEW_URL="https://your-glassview-worker.example"
export GLASSVIEW_UPLOAD_TOKEN="your-upload-token"
```

For local backend development, use `GLASSVIEW_LOCAL_URL` instead:

```bash
export GLASSVIEW_LOCAL_URL="http://localhost:8787"
export GLASSVIEW_UPLOAD_TOKEN="your-upload-token"
```

The skill prefers `GLASSVIEW_URL` when both URLs are set.
