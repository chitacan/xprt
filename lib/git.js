import { $ } from 'execa';
import ora from 'ora';

import { readConfig } from "./config.js";
import { updateResult } from './util.js';

const parseColon = (str, v) => {
  const [label, value] = str.split(':').map(d => d.trim())
  return {[label]: v ? v : value}
}

const parseAuthor = str => {
  const [ratio, ...nv] = str.trim().split(/\s+/).reverse()
  const [value, ...name] = nv.reverse()
  return {
    name: name.join(' '),
    value,
    ratio
  }
}

const parseSummaryCommit = summary => {
  const [
    project, age, branch, lastActive, active, commits, files, uncommitted, authorLabel, ...authors
  ] = summary.trim().split('\n')
  return {
    ...parseColon(commits),
    ...parseColon(files),
    ...parseColon(authorLabel, authors.map(parseAuthor))
  }
}

const parseSummaryLine = summary => {
  const [project, lines, authorLabel, ...authors] = summary.trim().split('\n')
  return {
    ...parseColon(lines),
    ...parseColon(authorLabel, authors.map(parseAuthor))
  }
}

export default async function() {
  const {config: configPath} = this.optsWithGlobals();
  const {repos, userNames} = readConfig(configPath);
  const spinner = ora('Loading...').start();

  try {
    const result = []
    spinner.text = `Processing ${repos.length} repos`;
    for (const {name, path} of repos) {
      spinner.start()
      spinner.text = `Processing commits in repo ${name}.`;
      const commit = await $({cwd: path})`git summary --dedup-by-email`
        .then(d => d.stdout)
        .then(d => parseSummaryCommit(d))
      spinner.succeed(spinner.text + ' Done');

      spinner.start()
      spinner.text = `Processing lines in repo ${name}.`;
      const line = await $({cwd: path})`git summary --line`
        .then(d => d.stdout)
        .then(d => parseSummaryLine(d))
      spinner.succeed(spinner.text + ' Done');

      result.push({
        project: name,
        commits: commit.commits,
        files: commit.files,
        lines: line.lines,
        authors: {
          commit: commit.authors.filter(d => userNames.includes(d.name)),
          line: line.authors.filter(d => userNames.includes(d.name))
        }
      })
    }

    updateResult({git: result}, configPath);
  } catch (err) {
    spinner.fail(err.message);
    console.error(err.stack)
  }
}