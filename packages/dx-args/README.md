# @davidwells/dx-args

A forgiving argv parser for CLIs that should keep working when someone types a slightly imperfect command.

`@davidwells/dx-args` keeps `oparser` as the value parser. It adds argv normalization, file/glob grouping, single-dash long option recovery, and a predictable result shape around it.

```js
const { dxParse } = require('@davidwells/dx-args')

const result = dxParse(['-files', 'README.md', '-dry'])

console.log(result.mergedOptions)
// { files: 'README.md', dry: true }

console.log(result.globGroups)
// [{ key: 'files', rawKey: '-files', values: ['README.md'] }]
```

## Install

```sh
npm install @davidwells/dx-args
```

## API

```js
const {
  dxParse,
  getGlobGroupsFromArgs,
  splitOutsideQuotes,
} = require('@davidwells/dx-args')
```

### `dxParse(argv, opts)`

Parses an argv array and returns a `ParseResult`.

```js
const result = dxParse(['--stage', 'prod', 'cool', '=', 'true'])

console.log(result.mergedOptions)
// { stage: 'prod', cool: true }
```

### `getGlobGroupsFromArgs(argv, opts)`

Extracts file and glob-like values into grouped collections.

```js
const result = getGlobGroupsFromArgs(
  ['--files', 'README.md', 'docs/**/*.md'],
  { globKeys: ['files'] }
)

console.log(result.globGroups)
// [{ key: 'files', rawKey: '--files', values: ['README.md', 'docs/**/*.md'] }]
```

### `splitOutsideQuotes(input)`

Splits a normalized option string while preserving quoted strings, objects, arrays, and `key = value` forms.

```js
splitOutsideQuotes('name = "David Wells" config={ enabled: true }')
// ['name="David Wells"', 'config={ enabled: true }']
```

## Accepted Input Forms

| Input | `mergedOptions` |
| --- | --- |
| `--stage prod` | `{ stage: 'prod' }` |
| `--stage=prod` | `{ stage: 'prod' }` |
| `stage = prod` | `{ stage: 'prod' }` |
| `stage=prod` | `{ stage: 'prod' }` |
| `-stage prod` | `{ stage: 'prod' }` |
| `-f README.md` | `{ f: 'README.md' }` |
| `--no-cache` | `{ cache: false }` |
| `--count 3` | `{ count: 3 }` |
| `--items=[1,2,3]` | `{ items: [1, 2, 3] }` |

File and glob-like values are also exposed through `globGroups`.

```js
const result = dxParse(['README.md', 'docs/**/*.md', '--stage', 'dev'])

console.log(result.globGroups)
// [{ key: '', rawKey: '', values: ['README.md', 'docs/**/*.md'] }]

console.log(result.mergedOptions)
// { stage: 'dev' }
```

## Result Shape

```ts
interface GlobGroup {
  key: string
  rawKey: string
  values: Array<string | RegExp>
}

interface ParseResult {
  rawArgv: string
  leadingCommands: string[]
  globGroups: GlobGroup[]
  extraParse: Record<string, unknown>
  mriOptionsOriginal: Record<string, unknown>
  mriOptionsClean: Record<string, unknown>
  mriDiff: boolean
  yargsParsed: string
  mergedOptions: Record<string, unknown>
}
```

Most callers should use:

- `mergedOptions` for parsed options.
- `globGroups` for file and glob-aware workflows.
- `leadingCommands` when a CLI has command-like leading words before options.

The remaining fields are diagnostic:

- `extraParse` is the `oparser`-derived parse result after argv normalization.
- `mriOptionsOriginal` is the raw `mri` result.
- `mriOptionsClean` is `mri` after cleanup of artifacts such as letters from `-stage`.
- `mriDiff` is true when cleanup changed the `mri` result.
- `yargsParsed` is not active; it is currently a compatibility/debug field.

## Glob Groups

`@davidwells/dx-args` groups file-looking and glob-looking arguments so CLIs can handle files separately from ordinary options.

```js
dxParse(['--files', 'README.md', 'docs/**/*.md']).globGroups
// [{ key: 'files', rawKey: '--files', values: ['README.md', 'docs/**/*.md'] }]
```

Bare file and glob values use an empty key:

```js
dxParse(['README.md', 'docs/**/*.md']).globGroups
// [{ key: '', rawKey: '', values: ['README.md', 'docs/**/*.md'] }]
```

Custom glob keys are configurable:

```js
dxParse(['--ignore', 'dist/**/*.md'], {
  globKeys: ['files', 'file', 'path', 'ignore']
}).globGroups
// [{ key: 'ignore', rawKey: '--ignore', values: ['dist/**/*.md'] }]
```

Shell-expanded file lists are intentionally not treated as leading commands:

```js
const result = dxParse(['README.md', 'NOTES.md', 'build', '=', 'false'])

console.log(result.globGroups)
// [{ key: '', rawKey: '', values: ['README.md', 'NOTES.md'] }]

console.log(result.mergedOptions)
// { build: false }
```

Values containing `node_modules/` are currently filtered from glob groups.

## Duplicate Values

Duplicate flags are last-write-wins by default.

```js
dxParse(['--stage', 'dev', '--stage', 'prod']).mergedOptions
// { stage: 'prod' }
```

Accumulation is explicit:

```js
dxParse(['--tag', 'one', '--tag', 'two'], {
  accumulate: ['tag']
}).mergedOptions
// { tag: ['one', 'two'] }
```

The parser currently accepts three option names for accumulation:

- `accumulate`
- `accumulateFlags`
- `arrayKeys`

Prefer `accumulate` in new code.

## Single Dash Policy

Multi-character single-dash options are treated as forgiving long options:

```js
dxParse(['-stage', 'prod']).mergedOptions
// { stage: 'prod' }
```

That also works when the value looks like a file:

```js
dxParse(['-config', 'md.config.js']).mergedOptions
// { config: 'md.config.js' }
```

Separate short flags still work:

```js
dxParse(['-l', '-a', '-h']).mergedOptions
// { l: true, a: true, h: true }
```

Short clusters are opt-in because they conflict with forgiving long option recovery:

```js
dxParse(['-abc']).mergedOptions
// { abc: true }

dxParse(['-abc'], {
  allowShortClusters: true,
  shortFlags: ['a', 'b', 'c']
}).mergedOptions
// { a: true, b: true, c: true }
```

## Markdown Magic Integration

Markdown Magic uses `dxParse` as its CLI parse boundary.

Markdown Magic maps parser output like this:

- `file`, `files`, `path`, and bare file groups become `config.files`.
- `ignore` groups become `config.ignore`.
- Other `mergedOptions` become Markdown Magic config overrides.
- `output` and `outputDir` normalization happens in Markdown Magic, not `@davidwells/dx-args`.

Example Markdown Magic commands:

```sh
md-magic -files README.md -config md.config.js -dry
md-magic --path "docs/**/*.md" --ignore "dist/**/*.md"
```

## Debugging

The package includes a small CLI that prints the full parse result:

```sh
dx-args -files README.md -config md.config.js -dry
```

When debugging, check:

- `mergedOptions`
- `globGroups`
- `mriOptionsOriginal`
- `mriOptionsClean`
- `mriDiff`

## Known Gaps

- Space-separated list capture like `--numbers 1 2 3 --strings a b c` is not supported yet.
- Real shell argv with quotes should be tested as arrays, not only string-split fixtures.
- Diagnostic fields may move under a `debug` or `trace` field before a stable `1.0.0`.
- `node_modules/` filtering is currently built into glob grouping.
- `--` rest passthrough should be specified and tested before it is documented as public API.
