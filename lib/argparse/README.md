# Argparse

WIP. A forgiven argv parser.

See `argparse.test.js` for usage.

Rules 

- If single char `-x` is found, it is a boolean flag.
- If `-x=value` is found, it is a key value pair.
- If `--` is found, then all following args collected as a full arg `rest`
