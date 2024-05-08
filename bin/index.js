#!/usr/bin/env node --no-warnings

import {Command} from 'commander';
import pkg from '../package.json' with { "type": "json" };
import gitAction from '../lib/git.js';
import githubAction from '../lib/github.js';
import starAction from '../lib/star.js';
import configAction from '../lib/config.js';

const cmd = new Command();

cmd
  .description(pkg.description)
  .version(pkg.version)
  .option('-c --config <config>', 'config file path')

cmd.command('config')
  .description('create empty config file.')
  .argument('[path]', 'config file path', process.cwd())
  .action(configAction)

cmd.command('git')
  .description('export summary data from git repos to result file.')
  .action(gitAction)

cmd.command('github')
  .alias('gh')
  .description('export github org review, comment, issue data to result file.')
  .action(githubAction)

cmd.command('all')
  .description('export github & git data to result file.')
  .action(async function() {
    await gitAction.call(this);
    await githubAction.call(this);
  });

cmd.command('star')
  .alias('st')
  .option('-o --output <output>', 'output dir', process.cwd())
  .description('export github starred data to "starred.json".')
  .action(starAction)

cmd.parseAsync(process.argv)
