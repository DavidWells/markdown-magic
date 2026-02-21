---
title: Contributing Guide
description: Complete guide for contributing to markdown-magic, including development setup, coding standards, testing guidelines, and the pull request process
---

# Contributing Guide

Thank you for your interest in contributing to markdown-magic! This guide will help you get started with contributing to the project.

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (version 10 or higher)
- Git

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/markdown-magic.git
   cd markdown-magic
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Project Structure

```
markdown-magic/
├── packages/              # Monorepo packages
│   ├── core/              # Core markdown-magic package
│   ├── block-parser/      # Comment block parser package
│   ├── block-replacer/    # Block replacement engine
│   ├── block-transformer/ # Transform orchestration engine
│   └── plugin-*/          # Optional plugin packages
├── examples/             # Usage examples
├── docs/                 # Documentation
├── packages/**/_tests/   # Test files
└── scripts/              # Build and development scripts
```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for all packages directly
pnpm -r test
```

### Types and Build

### Building

```bash
# Build all packages
pnpm build

# Generate declaration files where configured
pnpm types
```

### Testing Your Changes

1. **Link locally** to test in other projects:
   ```bash
   pnpm link --global
   cd /path/to/test-project
   pnpm link --global markdown-magic
   ```

2. **Run examples**:
   ```bash
   cd examples
   node basic-usage.js
   ```

3. **Test CLI**:
   ```bash
   pnpm --filter markdown-magic run cli -- --help
   pnpm --filter markdown-magic run cli -- --files './docs/*.md'
   ```

## Types of Contributions

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment information** (Node.js version, OS, etc.)
- **Minimal reproduction example**

**Bug Report Template**:
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version: 
- npm version:
- markdown-magic version:
- OS:

## Minimal Reproduction
[Include code or link to reproduction]
```

### Feature Requests

For new features:

- **Describe the use case** and problem being solved
- **Provide examples** of how it would be used
- **Consider backwards compatibility**
- **Discuss implementation approach** if you have ideas

### Code Contributions

#### Core Features

- **Discuss first**: Open an issue to discuss major changes
- **Follow patterns**: Match existing code style and patterns
- **Add tests**: Include comprehensive tests for new features
- **Update docs**: Add or update documentation

#### Built-in Transforms

New built-in transforms should:

- **Solve common use cases**
- **Be well-tested**
- **Include documentation and examples**
- **Follow naming conventions**

#### Bug Fixes

- **Include tests** that verify the fix
- **Keep changes minimal** and focused
- **Update relevant documentation**

## Coding Standards

### JavaScript Style

- **ES6+ features** are encouraged
- **2 spaces** for indentation
- **Semicolons** are generally omitted
- **Single quotes** for strings
- **Trailing commas** in multiline structures

### Naming Conventions

- **camelCase** for variables and functions
- **PascalCase** for classes
- **UPPER_CASE** for constants
- **kebab-case** for file names

### Code Organization

```js
// File structure
const dependencies = require('./dependencies')

// Constants
const DEFAULT_OPTIONS = {}

// Helper functions
function helperFunction() {}

// Main exports
module.exports = function mainFunction() {}

// or ES6 modules where appropriate
export default function mainFunction() {}
```

### Comments and Documentation

```js
/**
 * Transform function description
 * @param {object} api - Transform API payload
 * @param {string} api.content - The content to transform
 * @param {object} api.options - Transform options
 * @param {object} api.settings - Global configuration
 * @returns {string|Promise<string>} Transformed content
 */
function myTransform({ content, options, settings }) {
  // Implementation details
}
```

## Testing Guidelines

### Test Structure

```js
// test/transforms/my-transform.test.js
const myTransform = require('../../src/transforms/my-transform')

describe('myTransform', () => {
  describe('basic functionality', () => {
    it('should transform content correctly', () => {
      const content = 'input'
      const options = { option: 'value' }
      const result = myTransform(content, options)
      
      expect(result).toBe('expected output')
    })
  })
  
  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = myTransform('', {})
      expect(result).toBe('')
    })
    
    it('should handle missing options', () => {
      const result = myTransform('content', {})
      expect(result).toBeDefined()
    })
  })
  
  describe('error handling', () => {
    it('should throw on invalid options', () => {
      expect(() => {
        myTransform('content', { invalid: true })
      }).toThrow('Invalid option')
    })
  })
})
```

### Test Categories

1. **Unit tests**: Test individual functions and transforms
2. **Integration tests**: Test complete workflows
3. **CLI tests**: Test command-line interface
4. **Example tests**: Ensure examples work correctly

### Coverage Requirements

- **Minimum 80% coverage** for new code
- **100% coverage** for critical paths
- **Edge case testing** is important

## Documentation

### Types of Documentation

1. **API documentation**: JSDoc comments in code
2. **User guides**: Markdown files in `/docs`
3. **Examples**: Working examples in `/examples`
4. **README updates**: Keep main README current

### Documentation Standards

- **Clear and concise** explanations
- **Working examples** for all features
- **Up-to-date** with current API
- **Proper markdown formatting**

### Adding New Documentation

```bash
# Add new guide
touch docs/new-guide.md

# Update table of contents in README if needed
# Add links from other relevant documents
```

## Pull Request Process

### Before Submitting

- [ ] **Tests pass** locally
- [ ] **Linting passes** without errors
- [ ] **Documentation** is updated
- [ ] **Examples** work correctly
- [ ] **CHANGELOG** is updated (if applicable)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated checks** must pass
2. **Maintainer review** required
3. **Address feedback** promptly
4. **Squash commits** before merge (if requested)

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.1): Bug fixes
- **MINOR** (1.1.0): New features (backwards compatible)
- **MAJOR** (2.0.0): Breaking changes

### Changelog

Keep `CHANGELOG.md` updated with:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

## Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Welcome newcomers** and help them learn
- **Focus on constructive feedback**
- **Assume good intentions**

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code discussions
- **Discussions**: General questions and ideas

### Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **Release notes**: Acknowledging contributions
- **GitHub contributors**: Automatic recognition

## Need Help?

- **Documentation**: Check existing docs first
- **Examples**: Look at working examples
- **Issues**: Search existing issues
- **Discussions**: Ask questions in discussions
- **Contact**: Reach out to maintainers

Thank you for contributing to markdown-magic! 🎉