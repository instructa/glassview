# Testing

Run the main verification commands:

```bash
pnpm build
pnpm test
pnpm security:check
```

`pnpm build` runs TypeScript type checking.

`pnpm test` runs the Worker unit tests with an in-memory R2 implementation.

`pnpm security:check` runs local leak and dependency checks when the required tools are installed.

Before claiming a Glassview proof works, upload a real image and verify the returned viewer URL returns `200 OK`.
