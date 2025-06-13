# FileToc Transform Test

## Basic file tree

<!-- doc-gen FILETOC src="../../fixtures" maxDepth=2 -->
```
└── fixtures/
    ├── js/
    │   └── simple.js
    ├── md/
    │   ├── nested/
    │   │   ...
    │   ├── transform-file/
    │   │   ...
    │   ├── transform-toc/
    │   │   ...
    │   ├── basic.md
    │   ├── broken-inline.md
    │   ├── broken-whitespace-file.md
    │   ├── error-missing-transforms-two.md
    │   ├── error-missing-transforms.md
    │   ├── error-no-block-transform-defined.md
    │   ├── error-unbalanced.md
    │   ├── format-inline.md
    │   ├── format-with-wacky-indentation.md
    │   ├── inline-two.md
    │   ├── inline.md
    │   ├── mdx-file.mdx
    │   ├── missing-transform.md
    │   ├── mixed.md
    │   ├── no-transforms.md
    │   ├── string.md
    │   ├── syntax-legacy-colon.md
    │   ├── syntax-legacy-query.md
    │   ├── syntax-mixed.md
    │   ├── transform-code.md
    │   ├── transform-custom.md
    │   ├── transform-file.md
    │   ├── transform-filetoc.md
    │   ├── transform-remote.md
    │   ├── transform-toc.md
    │   └── transform-wordCount.md
    ├── output/
    │   ├── md/
    │   │   ...
    │   └── test/
    │       ...
    ├── local-code-file-lines.js
    ├── local-code-file.js
    └── local-code-id.js
```
<!-- end-doc-gen -->

## File tree with list format

<!-- doc-gen FILETOC src="../../fixtures" maxDepth=2 format="list" -->
- **fixtures/**
  - **js/**
    - simple.js
  - **md/**
    - **nested/**
      - ...
    - **transform-file/**
      - ...
    - **transform-toc/**
      - ...
    - basic.md
    - broken-inline.md
    - broken-whitespace-file.md
    - error-missing-transforms-two.md
    - error-missing-transforms.md
    - error-no-block-transform-defined.md
    - error-unbalanced.md
    - format-inline.md
    - format-with-wacky-indentation.md
    - inline-two.md
    - inline.md
    - mdx-file.mdx
    - missing-transform.md
    - mixed.md
    - no-transforms.md
    - string.md
    - syntax-legacy-colon.md
    - syntax-legacy-query.md
    - syntax-mixed.md
    - transform-code.md
    - transform-custom.md
    - transform-file.md
    - transform-filetoc.md
    - transform-remote.md
    - transform-toc.md
    - transform-wordCount.md
  - **output/**
    - **md/**
      - ...
    - **test/**
      - ...
  - local-code-file-lines.js
  - local-code-file.js
  - local-code-id.js
<!-- end-doc-gen -->

## File tree with size

<!-- doc-gen FILETOC src="../../fixtures/js" showSize=true -->
```
└── js/
    └── simple.js (552 B)
```
<!-- end-doc-gen -->