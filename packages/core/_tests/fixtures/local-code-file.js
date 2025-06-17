
const html = {
  tags: [
    '<!--', 
    '-->'
  ],
  pattern: [
    '<!-{2,}', 
    '-{2,}>' // '-->'
  ],
}

module.exports.run = () => {
  const time = new Date()
  console.log(`Your cron ran ${time}`)
}
