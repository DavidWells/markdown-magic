# AGENTS.md

## Package Manager

Use `pnpm` from the repo root. The workspace is configured in `pnpm-workspace.yaml`
and includes `packages/*`.

Common checks:

```bash
pnpm install
pnpm -r test
pnpm -r types
pnpm -r build
```

For focused package checks, prefer filters:

```bash
pnpm --filter markdown-magic test
pnpm --filter @davidwells/dx-args test
pnpm --filter @davidwells/dx-args types
```

## Publishing

This repo publishes packages with Lerna in independent-version mode. Use the
local Lerna binary from the repo root.

First inspect which packages Lerna thinks changed:

```bash
./node_modules/.bin/lerna changed
```

Then publish with:

```bash
./node_modules/.bin/lerna publish
```

`lerna.json` configures:

- independent package versions
- `pnpm` as the npm client
- conventional commits for publish
- release commit message: `chore(release): publish`

If publishing a scoped package manually, include public access:

```bash
cd packages/dx-args
pnpm publish --access public
```

## Current Parser Package

The forgiving CLI parser lives in `packages/dx-args` and is published as
`@davidwells/dx-args`. The executable bin remains `dx-args`.

Markdown Magic core keeps compatibility wrappers in:

- `packages/core/src/argparse/argparse.js`
- `packages/core/src/argparse/splitOutsideQuotes.js`
- `packages/core/src/globparse.js`

Do not reintroduce parser implementation code into core; import from
`@davidwells/dx-args` instead.
