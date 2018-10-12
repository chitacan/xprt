const {shell} = require('execa')
const {outputJsonSync} = require('fs-extra')
const {Signale, fatal} = require('signale')
const {existsSync, readdirSync} = require('fs')
const {join, resolve} = require('path')
const {parseSummaryCommit, parseSummaryLine} = require('./utils')

const log = new Signale({interactive: true})

module.exports = async (repos_dir) => {
  try {
    const repos = resolve(process.cwd(), repos_dir)
    if (!existsSync(repos)) {
      throw new Error(`${repos} not exists. abort.`)
    }
    const dirs = readdirSync(repos)

    const result = []
    for (const dir of dirs) {
      log.pending(`processing repo '${dir}'`)
      const cwd = join(repos, dir)

      log.pending(`processing repo '${dir}' commits`)
      const commit = await shell('git summary < /dev/tty', {cwd})
        .then(d => d.stdout)
        .then(d => parseSummaryCommit(d))

      log.pending(`processing repo '${dir}' lines`)
      const line = await shell('git summary --line < /dev/tty', {cwd})
        .then(d => d.stdout)
        .then(d => parseSummaryLine(d))

      result.push({
        project: commit.project,
        commits: commit.commits,
        files: commit.files,
        lines: line.lines,
        authors: {
          commit: commit.authors,
          line: line.authors
        }
      })
    }
    outputJsonSync('git.json', result, {spaces: 2})
    log.success('result saved on "git.json"')
  } catch (err) {
    fatal(err)
  }
}
