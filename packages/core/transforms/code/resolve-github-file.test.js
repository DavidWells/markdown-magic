const { resolveGithubContents, getGitHubFileContentsRaw } = require('./resolve-github-file')

let repoFilePath
repoFilePath = 'https://github.com/DavidWells/markdown-magic/blob/master/package.json'
// repoFilePath = 'https://github.com/DavidWells/notes/blob/master/cognito.md'
// repoFilePath = 'github.com/DavidWells/notes/blob/master/cognito.md#L1-L5'
repoFilePath = 'github.com/DavidWells/notes/blob/master/cognito.md'
// repoFilePath = 'https://raw.githubusercontent.com/DavidWells/notes/master/cognito.md'
// repoFilePath = 'raw.githubusercontent.com/DavidWells/notes/master/cognito.md'
// repoFilePath = 'https://github.com/reapit/foundations/blob/53b2be65ea69d5f1338dbea6e5028c7599d78cf7/packages/connect-session/src/browser/index.ts#L125-L163'

/*
resolveGithubContents({
  repoFilePath,
  debug: true,
  //accessToken: process.env.GITHUB_LAST_EDITED_TOKEN
})
  .then(console.log)
  .catch(console.error);
/** */

/*
getGitHubFileContentsRaw({
  repoOwner: 'DavidWells', 
  repoName: 'notes',
  filePath: 'cognito.md', 
  branch: 'master', 
  accessToken: process.env.GITHUB_LAST_EDITED_TOKEN
})
  .then(console.log)
  .catch(console.error);
/** */
