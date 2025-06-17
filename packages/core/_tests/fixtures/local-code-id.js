const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const merge = require('deepmerge')
const transforms = require('./transforms')
const regexUtils = require('./utils/regex')
const pluginSortOrder = require('./utils/sortOrder')
const updateContents = require('./updateContents')
const cwd = process.cwd()

module.exports = async function processFile(filePath, config) {
  let content
  /** CODE_SECTION:3_5:START */
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  const myFirstIssue = myIssues.nodes[0];
  const myFirstIssueComments = await myFirstIssue.comments();
  const myFirstIssueFirstComment = myFirstIssueComments.nodes[0];
  const myFirstIssueFirstCommentUser = await myFirstIssueFirstComment.user;
  /** CODE_SECTION:3_5:END */

  /* Code xyz */
  console.log('cool')
  /* Code xyz */

  /* ref:start wow */
  console.log('rad')
  /* ref:end */

  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.log(`FILE NOT FOUND ${filePath}`)
    throw e
  }
}