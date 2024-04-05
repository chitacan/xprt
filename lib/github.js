import { Octokit } from "octokit";
import ora from 'ora';

import { readConfig } from "./config.js";
import { updateResult, readGHHost } from './util.js';

const destructureIssue = issue => {
  const {
    user, title, number, state, comments, reactions, pull_request,
    repository_url, created_at, labels, milestone
  } = issue
  const [,,,,owner, repo] = repository_url.split('/')
  return {
    owner,
    repo,
    user: user ? user.login : user,
    title,
    number,
    state,
    comments,
    reactions,
    created_at,
    labels: labels.map(d => d.name),
    milestone,
    is_pr: !!pull_request
  }
}

const destructureReview = review => {
  const {user, state, submitted_at} = review
  return {
    user: user ? user.login : user,
    state,
    submitted_at
  }
}

const destructureComment = comment => {
  const {user, created_at} = comment
  return {
    user: user ? user.login : user,
    created_at
  }
}

export default async function() {
  const {config: configPath} = this.optsWithGlobals();
  const config = readConfig(configPath);

  const spinner = ora('Loading...').start();

  try {
    const {user, oauth_token} = readGHHost();
    const github = new Octokit({ auth: oauth_token });

    spinner.text = `Fetching issues authored by ${user} in ${config.orgName}.`;
    const issuesIterator = github.paginate.iterator(
      github.rest.search.issuesAndPullRequests,
      {
        q: `org:${config.orgName} author:${user}`,
        per_page: 100
      }
    );
      
    const authored = [];
    for await (const {data} of issuesIterator) {
      for (const issue of data) {
        const converted = destructureIssue(issue);
        if (converted.is_pr) {
          const {commits, additions, deletions, changed_files} = await github.rest.pulls.get({
              owner: converted.owner,
              repo: converted.repo,
              pull_number: converted.number
            })
            .then(d => d.data)

          authored.push({
            ...converted,
            commits,
            additions,
            deletions,
            changed_files
          });
        } else {
          authored.push(converted);
        }
      }
    }
    spinner.succeed(spinner.text + ' Done');

    spinner.start();
    spinner.text = `Fetching reviews by ${user} in ${config.orgName}.`;
    const reviewsIterator = github.paginate.iterator(
      github.rest.search.issuesAndPullRequests,
      {
        q: `org:${config.orgName} reviewed-by:${user}`,
        per_page: 100
      }
    );

    const reviewed = [];
    for await (const {data} of reviewsIterator) {
      for (const pr of data) {
        const converted = destructureIssue(pr);
        const reviewsInPR = await github.rest.pulls.listReviews({
          owner: converted.owner,
          repo: converted.repo,
          pull_number: converted.number,
          per_page: 100
        })
        .then(d => d.data.map(destructureReview))

        reviewed.push({
          ...converted,
          reviews: reviewsInPR
        });
      }
    }
    spinner.succeed(spinner.text + ' Done');

    spinner.start();
    spinner.text = `Fetching comments by ${user} in ${config.orgName}.`;
    const commentsIterator = github.paginate.iterator(
      github.rest.search.issuesAndPullRequests,
      {
        q: `org:${config.orgName} commenter:${user}`,
        per_page: 100
      }
    );

    const commented = [];
    for await (const {data} of commentsIterator) {
      for (const issue of data) {
        const converted = destructureIssue(issue);
        const commentsInIssue = await github.rest.issues.listComments({
          owner: converted.owner,
          repo: converted.repo,
          issue_number: converted.number,
          per_page: 100
        })
        .then(d => d.data.map(destructureComment))

        if (commentsInIssue.length > 0) {
          commented.push({
            ...converted,
            comments: commentsInIssue
          });
        }
      }
    }
    spinner.succeed(spinner.text + ' Done');

    updateResult({github: {authored, reviewed, commented}}, configPath);
  } catch (err) {
    spinner.fail(err.message);
    console.error(err.stack)
  }
}