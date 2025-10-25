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
<!-- docs CONTRIBUTORS -->
<!-- /docs -->
```

## Options

- **`repo`** (optional): GitHub repository in format `owner/repo`. Default: auto-detected from git remote
- **`format`** (optional): Output format. Options: `table`, `list`, `aligned`. Default: `table`
- **`token`** (optional): GitHub API token for authentication. Default: uses `GITHUB_TOKEN` environment variable

## Examples

### Table Format (Default)

```md
<!-- docs CONTRIBUTORS -->
<!-- /docs -->
```

### List Format

```md
<!-- docs CONTRIBUTORS format=list -->
<!-- /docs -->
```

### Aligned Format with Specific Repository

```md
<!-- docs CONTRIBUTORS repo=facebook/react format=aligned -->
<!-- /docs -->
```

## Authentication

For private repositories or to avoid rate limiting, set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

Or pass it as an option:

```md
<!-- docs CONTRIBUTORS token=your_github_token_here -->
<!-- /docs -->
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