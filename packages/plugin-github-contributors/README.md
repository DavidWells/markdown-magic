# @markdown-magic/github-contributors

> Generate GitHub repository contributors table automatically in markdown - Plugin for markdown-magic

## Installation

```bash
npm install @markdown-magic/github-contributors
```

## Usage

Add the plugin to your markdown-magic configuration:

```js
const { markdownMagic } = require('markdown-magic')
const contributors = require('@markdown-magic/github-contributors')

const config = {
  transforms: {
    CONTRIBUTORS: contributors
  }
}

markdownMagic('README.md', config)
```

Then use in your markdown files:

```md
<!-- doc-gen CONTRIBUTORS -->
<!-- end-doc-gen -->
```

## Options

- **`repo`** (optional): GitHub repository in format `owner/repo`. Default: auto-detected from git remote
- **`format`** (optional): Output format. Options: `table`, `list`, `aligned`. Default: `table`
- **`token`** (optional): GitHub API token for authentication. Default: uses `GITHUB_TOKEN` environment variable

## Examples

### Table Format (Default)

```md
<!-- doc-gen CONTRIBUTORS -->
<!-- end-doc-gen -->
```

### List Format

```md
<!-- doc-gen CONTRIBUTORS format=list -->
<!-- end-doc-gen -->
```

### Aligned Format with Specific Repository

```md
<!-- doc-gen CONTRIBUTORS repo=facebook/react format=aligned -->
<!-- end-doc-gen -->
```

## Authentication

For private repositories or to avoid rate limiting, set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

Or pass it as an option:

```md
<!-- doc-gen CONTRIBUTORS token=your_github_token_here -->
<!-- end-doc-gen -->
```

## Output Formats

### Table Format
Generates a table with contributor avatars and commit counts.

### List Format  
Generates a simple bulleted list of contributors.

### Aligned Format
Generates an aligned table layout with larger avatars.

## License

MIT