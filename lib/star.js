import { Octokit } from "octokit";
import ora from 'ora';
import { join } from 'path';
import { readGHHost, resolvePath } from './util.js';
import { writeFileSync } from "fs";

export default async function(opts) {
  const spinner = ora('Loading...').start();
  try {
    const {user, oauth_token} = readGHHost();

    spinner.text = `Fetching starred repos by ${user}.`;
    const github = new Octokit({ auth: oauth_token });
    const starredIterator = github.paginate.iterator(
      github.rest.activity.listReposStarredByAuthenticatedUser,
      {
        per_page: 100,
        headers: {
          accept: 'application/vnd.github.star+json'
        }
      }
    )

    const repos = [];
    for await (const data of starredIterator) {
      for (const {starred_at, repo} of data) {
        const {name, html_url, language, topics, stargazers_count} = repo;
        repos.push({
          name,
          url: html_url,
          language,
          topics,
          stars: stargazers_count,
          starred_at
        })
      }
    }
    spinner.succeed(spinner.text + ' Done');

    const outputPath = resolvePath(join(opts.output, 'starred.json'));
    writeFileSync(outputPath, JSON.stringify(repos, null, 2));
  } catch (err) {
    spinner.fail(err.message);
    console.error(err.stack);
  }
}