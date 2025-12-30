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

### npm releases

Packages are published to npm individually:

```bash
cd packages/core
pnpm run release:patch  # or release:minor, release:major
```

### Binary releases

Binaries are automatically built and published to GitHub Releases when a version tag is pushed:

```bash
git tag v4.0.5
git push origin v4.0.5
```

This triggers the `release-binary.yml` workflow which:
1. Builds binaries for all platforms (macOS, Linux, Windows)
2. Creates checksums
3. Publishes a GitHub Release with all assets

You can also trigger a binary release manually:

```bash
gh workflow run release-binary.yml -f version=v4.0.5
```

### Binary platforms

| Platform | Binary |
|----------|--------|
| macOS (Apple Silicon) | `md-magic-darwin-arm64` |
| macOS (Intel) | `md-magic-darwin-x64` |
| Linux (x64) | `md-magic-linux-x64` |
| Linux (ARM64) | `md-magic-linux-arm64` |
| Windows (x64) | `md-magic-windows-x64.exe` |
