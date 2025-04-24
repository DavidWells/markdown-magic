# Introducing LLRT: A Faster Way to Run JavaScript on AWS Lambda

This repository showcases how to build high-performance serverless APIs using AWS Lambda with LLRT (Low Latency Runtime). LLRT is a game-changing JavaScript runtime that's specifically optimized for AWS Lambda environments.

## Why LLRT?

LLRT offers several compelling advantages over traditional Node.js runtimes:

1. **Lightning-Fast Cold Starts**: LLRT is built from the ground up to minimize cold start latency, making your Lambda functions respond almost instantly.
2. **ARM64 Optimization**: Built for ARM64 architecture, LLRT delivers better performance while reducing costs compared to x86-based runtimes.
3. **Minimal Memory Footprint**: The runtime is incredibly lightweight, allowing your functions to start up with minimal memory overhead.
4. **Full Node.js Compatibility**: Despite its lightweight nature, LLRT maintains compatibility with Node.js APIs, making it easy to migrate existing code.

## Gotchas

Not every feature is supported yet, see https://github.com/awslabs/llrt?tab=readme-ov-file#compatibility-matrix & https://github.com/awslabs/llrt/issues

## Dream state

I'm imagining a world where your code AST is parsed and you can automatically infer whether or not the LLRT runtime will work for your code and then it's automatically applied for all of these benefits listed above.

One day...

<!-- doc-gen FILE 
  src="./x.md"
  shiftHeaders=-1 
  removeLeadingH1
-->
push notifications are a powerful and free browser feature that is often overlooked by products due to the complexity of service workers and the backend infra required to send notifications.

in this post we will discuss how to implement you own push notification service that will scale as you grow.

We will use service workers and AWS lambda functions to send notifications to a site saved as a PWA on the users phone.

# Demo

Here is a demo of what we are building:

very cool

# Implementation

For this service we are using AWS lambda and deploying via the serverless framework. You can deploy this type of application in any kind of backend but I prefer the pay per execution model of the AWS serverless offerings.

Frontend setup


```json
{
  "name": "markdown-magic",
  "version": "3.4.1",
```

```test
function matchInnerContent(str, open, close) {
  const pattern = new RegExp(`\\/\\/ ${open}\\n([\\s\\S]*?)\\n\\/\\/ ${close}`, 'g')

  // console.log('closeTagRegex', closeTagRegex)
  var matches
  var blocks = []
  while ((matches = pattern.exec(str)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ _match, innerContent ] = matches
    console.log('matches', matches)
    blocks.push(innerContent)
  }
  return blocks
}
```

```json
{
  "name": "markdown-magic",
  "version": "3.4.1",
  "description": "Automatically update markdown files with content from external sources",
  "main": "lib/index.js",
  "bin": {
    "markdown": "./cli.js",
    "md-magic": "./cli.js",
    "mdm": "./cli.js"
  },
  "files": [
    "README.md",
    "package.json",
    "package-lock.json",
    "cli.js",
    "/lib"
  ],
  "scripts": {
    "types": "tsc",
    "emit-types": "tsc --noEmit false --emitDeclarationOnly true",
    "docs": "node examples/generate-readme.js",
    "test": "npm run test:lib && npm run test:test && echo 'tests done'",
    "test:lib": "uvu lib '.test.([mc]js|[jt]sx?)$'",
    "test:test": "uvu test '.test.([mc]js|[jt]sx?)$'",
    "test:block": "uvu lib 'block-parser.test.([mc]js|[jt]sx?)$'",
    "test:cli": "uvu lib 'cli.test.([mc]js|[jt]sx?)$'",
    "test:md": "uvu lib 'md.test.([mc]js|[jt]sx?)$'",
    "test:fs": "uvu lib 'fs.test.([mc]js|[jt]sx?)$'",
    "test:js": "uvu lib 'block-parser-js.test.([mc]js|[jt]sx?)$'",
    "test:errors": "uvu test 'errors.test.([mc]js|[jt]sx?)$'",
    "test:transforms": "uvu test 'transforms.test.([mc]js|[jt]sx?)$'",
    "test:text": "uvu lib 'text.test.([mc]js|[jt]sx?)$'",
    "cli": "node ./cli.js --path 'README.md' --config ./markdown.config.js",
    "publish": "git push origin && git push origin --tags",
    "release:patch": "npm version patch && npm publish",
    "release:minor": "npm version minor && npm publish",
    "release:major": "npm version major && npm publish"
  },
  "author": "David Wells",
  "license": "MIT",
  "homepage": "https://github.com/DavidWells/markdown-magic#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/DavidWells/markdown-magic"
  },
  "dependencies": {
    "@davidwells/md-utils": "^0.0.46",
    "globrex": "^0.1.2",
    "gray-matter": "^4.0.3",
    "is-glob": "^4.0.3",
    "is-local-path": "^0.1.6",
    "is-valid-path": "^0.1.1",
    "micro-mdx-parser": "^1.1.0",
    "mri": "^1.2.0",
    "node-fetch": "^2.7.0",
    "oparser": "^3.0.22",
    "smart-glob": "^1.0.2",
    "string-width": "^4.2.3",
    "sync-request": "^6.1.0"
  },
  "devDependencies": {
    "ansi-styles": "^4.2.1",
    "concordance": "^5.0.1",
    "doxxx": "^2.0.7",
    "rimraf": "^3.0.2",
    "safe-chalk": "^1.0.0",
    "typescript": "^5.0.2",
    "uvu": "^0.5.1"
  }
}
```

<!-- doc-genx CODE src="github.com/DavidWells/notes/blob/master/cognito.md" accessToken='process.env.GITHUB_LAST_EDITED_TOKEN' isPrivate -->
```md
# AWS Cognito Notes.

# Resources

- [Mega post](https://www.integralist.co.uk/posts/cognito/)


# Pricing
- [Cognito Federated Identities unauthenticated identities, that is free](https://forums.aws.amazon.com/thread.jspa?threadID=268422)

# Misc

Fetch to get token https://github.com/reapit/foundations/blob/53b2be65ea69d5f1338dbea6e5028c7599d78cf7/packages/connect-session/src/browser/index.ts#L125-L163
```

Backend setup

Infrastructure as code

Productionizing

In the demo we are utilizing dynamoDB and scan operations to fetch the list of subscriptions to send notifications to. This works okay to start out but eventually you may want to optimize this with a slightly different data model, especially if you have multiple different channels the users can subscribe to.

Wrapping up

Here is a link to the GitHub repo that includes the source code to this post.
<!-- end-doc-gen -->
