# Table of Contents Example

This file shows how to use the `TOC` and `sectionToc` transforms.

<!-- doc-gen TOC maxDepth=2 -->
- [Heading 1](#heading-1)
  - [heading 2](#heading-2)
  - [heading 2 2](#heading-2-2)
  - [Subsection one](#subsection-one)
- [Heading 1 2](#heading-1-2)
  - [one two](#one-two)
<!-- end-doc-gen -->

# Heading 1

<!-- doc-gen TOC sub -->
<details>
<summary>Heading 1 contents</summary>

- [heading 2](#heading-2)
- [heading 2 2](#heading-2-2)
- [Subsection one](#subsection-one)
  - [nice](#nice)
  - [yyy](#yyy)
    - [four](#four)

</details>
<!-- end-doc-gen -->

## heading 2

## heading 2 2

## Subsection one

Nice

<!-- doc-gen sectionToc -->
<details>
<summary>Subsection one contents</summary>

- [nice](#nice)
- [yyy](#yyy)
  - [four](#four)

</details>
<!-- end-doc-gen -->

### nice

### yyy

#### four

# Heading 1 2

## one two