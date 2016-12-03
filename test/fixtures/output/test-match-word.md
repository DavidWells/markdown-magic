# Test Changing Comment MatchWord

The comments in this markdown file use `YOLO:START` instead of the default match word

<!-- YOLO:START (CODE:src=./local-code-file.js&syntax=js) -->
<!-- The below code snippet is automatically added from ./local-code-file.js -->
```js
module.exports.run = () => {
  const time = new Date()
  console.log(`Your cron ran ${time}`)
}
```
<!-- YOLO:END -->

This is normal text in markdown. Keep it.