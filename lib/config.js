import untildify from "untildify";
import ora from "ora";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { resolvePath } from "./util.js";

const EMPTY_CONFIG = {
  orgName: '',
  userNames: [],
  repos: [{name: '', path: ''}]
}

export const readConfig = (path) => {
  if (!path) {
    throw new Error('config path is required. abort.');
  }
  const configPath = resolvePath(path);

  if (!existsSync(configPath)) {
    throw new Error(`${configPath} not exists. abort.`);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const repos = config.repos.map(({name, path}) => ({name, path: untildify(path)}));

  for (const repo of repos) {
    if (!existsSync(repo.path)) {
      throw new Error(`${repo.path} not exists. abort.`);
    }
  }

  return {
    ...config,
    repos
  };
}

export default async function(configPath) {
  const spinner = ora('Loading...').start();
  const file = join(resolvePath(configPath), 'config.json');
  if (existsSync(file)) {
    spinner.fail(`${file} already exists. abort.`);
  } else {
    writeFileSync(file, JSON.stringify(EMPTY_CONFIG, null, 2));
    spinner.succeed(`${file} created.`);
  }
}