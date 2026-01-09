# Contributing to Markdown Magic

## Project Setup

This is a pnpm monorepo. Make sure you have pnpm installed:

```bash
npm install -g pnpm
```

### Install dependencies

```bash
pnpm install
```

### Project structure

```
packages/
  core/           # Main markdown-magic package (published as `markdown-magic`)
  block-parser/   # Comment block parser
  block-replacer/ # Comment block replacer
  block-transformer/ # Block transformer
```

### Running tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/core && pnpm test
```

### Building types

```bash
pnpm types
```

## Development

### Local CLI testing

```bash
cd packages/core
node cli.js --help
node cli.js --files README.md --dry
```

### Building binaries locally

Requires [Bun](https://bun.sh):

```bash
cd packages/core

# Build for current platform
bun build ./cli.js --compile --minify --outfile dist/md-magic

# Build all platforms
pnpm run bundle:all
```

## Releases

### Publishing (npm + binaries)

Use lerna to publish all changed packages:

```bash
lerna publish
```

This will:
1. Bump versions for changed packages
2. Publish to npm
3. Create git tags and GitHub releases (e.g., `markdown-magic@4.0.5`)
4. Automatically trigger binary builds via GitHub Actions

### Binary release workflows

Two workflows build platform binaries when releases are created:

- `release-binary-md-magic.yml` - triggers on `markdown-magic@*` releases
- `release-binary-block-parser.yml` - triggers on `comment-block-parser@*` releases

These use the `release: created` event (not `push: tags`) because lerna's `GITHUB_TOKEN` can't trigger workflows on tag push (GitHub prevents this to avoid infinite loops).

### Manual binary release

You can also trigger a binary release manually:

```bash
gh workflow run release-binary.yml -f version=markdown-magic@4.0.5
```

### Binary platforms

| Platform | Binary |
|----------|--------|
| macOS (Apple Silicon) | `md-magic-darwin-arm64` |
| macOS (Intel) | `md-magic-darwin-x64` |
| Linux (x64) | `md-magic-linux-x64` |
| Linux (ARM64) | `md-magic-linux-arm64` |
| Windows (x64) | `md-magic-windows-x64.exe` |
