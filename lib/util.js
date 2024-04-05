import untildify from "untildify";
import { load } from 'js-yaml';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname, resolve, isAbsolute} from 'path';

const GH_HOST_FILE = '~/.config/gh/hosts.yml';

export const readGHHost = () => {
  const ghHostFile = untildify(GH_HOST_FILE);
  if (!existsSync(ghHostFile)) {
    throw new Error(`Install gh cli and login first. abort.`);
  }
  const ghHost = load(readFileSync(ghHostFile, 'utf8'));
  return ghHost['github.com'];
}

export const updateResult = (result, configPath) => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const resultFile = join(dirname(configPath), `${config.orgName}.json`);

  if (existsSync(resultFile)) {
    const oldResult = JSON.parse(readFileSync(resultFile, 'utf8'))
    writeFileSync(resultFile, JSON.stringify({...oldResult, ...result, updated: new Date()}, null, 2))
  } else {
    writeFileSync(resultFile, JSON.stringify({...result, updated: new Date()}, null, 2))
  }
}

export const resolvePath = path => {
  const maybeUntildified = untildify(path);
  if (isAbsolute(maybeUntildified)) {
    return maybeUntildified;
  } else {
    return resolve(process.cwd(), maybeUntildified);
  }
}