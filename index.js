#!/usr/bin/env node

const cmd = require('commander')
const git = require('./lib/git')
const github = require('./lib/github')
const share = require('./lib/share')
const {version} = require('./package')

cmd
  .description()
  .version(version)

cmd.command('git <repos_dir>')
  .description('export summary data from git repos to "git.json".')
  .action(git)

cmd.command('github')
  .alias('gh')
  .description('export github org review, comment, issue data to "github.json".')
  .action(github)

cmd.command('share <files...>')
  .description('upload <files> to private gist.')
  .option('-p --public', 'make gist public')
  .option('-r --raw', 'print raw url')
  .action(share)

cmd.parse(process.argv)
