const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  const context = github.context

  let issueNumber, prNumber, headRef, baseRef, headSha, isPR = false;
  let triggerText = '';

  if (context.eventName === 'pull_request_target') {
    // When a PR is created or updated
    isPR = true;
    issueNumber = context.payload.pull_request.number;
    prNumber = context.payload.pull_request.number;
    headRef = context.payload.pull_request.head.ref;
    baseRef = context.payload.pull_request.base.ref;
    headSha = context.payload.pull_request.head.sha;
    triggerText = context.payload.pull_request.body;
    
    console.log(`PR #${prNumber}: ${baseRef} <- ${headRef} (${headSha})`);
    
  } else if (context.eventName === 'issues') {
    // When an Issue is created or assigned
    isPR = false;
    issueNumber = context.payload.issue.number;
    triggerText = `${context.payload.issue.title} ${context.payload.issue.body}`;
    
    console.log(`Issue #${issueNumber} created`);
    
  } else if (context.eventName === 'issue_comment') {
    // Issue/PR comment
    issueNumber = context.payload.issue.number;
    triggerText = context.payload.comment.body;
    
    if (context.payload.issue.pull_request) {
      // Comment on a PR
      isPR = true;
      try {
        const pr = await github.rest.pulls.get({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: issueNumber
        });
        prNumber = issueNumber;
        headRef = pr.data.head.ref;
        baseRef = pr.data.base.ref;
        headSha = pr.data.head.sha;
        
        console.log(`PR Comment #${prNumber}: ${baseRef} <- ${headRef}`);
      } catch (error) {
        console.error('Error fetching PR info:', error);
        // In case of error, treat as a regular Issue
        isPR = false;
      }
    } else {
      // Regular Issue comment
      isPR = false;
      console.log(`Issue Comment #${issueNumber}`);
    }
    
  } else if (context.eventName === 'pull_request_review_comment' || context.eventName === 'pull_request_review') {
    // PR review related
    isPR = true;
    issueNumber = context.payload.pull_request.number;
    prNumber = context.payload.pull_request.number;
    headRef = context.payload.pull_request.head.ref;
    baseRef = context.payload.pull_request.base.ref;
    headSha = context.payload.pull_request.head.sha;
    
    if (context.eventName === 'pull_request_review_comment') {
      triggerText = context.payload.comment.body;
    } else {
      triggerText = context.payload.review.body;
    }
    
    console.log(`PR Review #${prNumber}: ${baseRef} <- ${headRef}`);
  }

  // Set outputs
  core.setOutput('issue-number', issueNumber);
  core.setOutput('pr-number', prNumber || '');
  core.setOutput('head-ref', headRef || '');
  core.setOutput('base-ref', baseRef || '');
  core.setOutput('head-sha', headSha || '');
  core.setOutput('is-pr', isPR);
  core.setOutput('trigger-text', triggerText);

  console.log(`Final Context: Issue #${issueNumber}, isPR: ${isPR}, Event: ${context.eventName}`);

}
