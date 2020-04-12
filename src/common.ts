import { execSync } from 'child_process';
import * as cross_spawn from 'cross-spawn';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseUrl } from 'url';

import { Repository } from 'nodegit';
import { IScratchOrg } from './api';

const AUTH_URL_FILE = 'tmp_hutte_login';

export const sfdxLogin = (org: IScratchOrg): Promise<IScratchOrg> =>
  new Promise((resolve, reject) => {
    writeFileSync(AUTH_URL_FILE, org.sfdxAuthUrl);
    const child = cross_spawn('sfdx', [
      'force:auth:sfdxurl:store',
      '-f',
      AUTH_URL_FILE,
      '-a',
      `hutte-${org.slug}`,
      '--setdefaultusername',
    ]);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('close', (code) => {
      unlinkSync(AUTH_URL_FILE);

      if (code === 0) {
        resolve(org);
      } else {
        reject('The sfdx login failed.');
      }
    });
  });

export const devHubSfdxLogin = (org: IScratchOrg): Promise<IScratchOrg> =>
  new Promise((resolve, reject) => {
    writeFileSync(AUTH_URL_FILE, org.devhubSfdxAuthUrl);
    const child = cross_spawn('sfdx', [
      'force:auth:sfdxurl:store',
      '-f',
      AUTH_URL_FILE,
      '-a',
      devHubAlias(org),
      '-d',
    ]);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('close', (code) => {
      unlinkSync(AUTH_URL_FILE);

      if (code === 0) {
        resolve(org);
      } else {
        reject('The devhub login failed.');
      }
    });
  });

export const flagAsScratchOrg = (org: IScratchOrg): Promise<IScratchOrg> => {
  const orgInfo = JSON.parse(
    execSync('sfdx force:org:display --json').toString(),
  );
  const configFile = join(
    homedir(),
    '.sfdx',
    `${orgInfo.result.username}.json`,
  );

  const config = JSON.parse(readFileSync(configFile).toString());

  writeFileSync(
    configFile,
    JSON.stringify({ ...config, devHubUsername: devHubAlias(org) }, null, 4),
  );

  return Promise.resolve(org);
};

export const projectRepoFromOrigin = (): Promise<string> =>
  Repository.open(process.cwd())
    .then((repo) => repo.getRemote('origin'))
    .then((remote) => extractGithubRepoName(remote.url()));

const extractGithubRepoName = (remoteUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let url = parseUrl(remoteUrl).path;

    if (url[0] === '/') {
      url = url.substr(1);
    }

    if (url.indexOf(':') >= 0) {
      url = url.slice(url.indexOf(':') + 1);
    }

    if (url.slice(-4) === '.git') {
      url = url.slice(0, -4);
    }

    resolve(url);
  });

const devHubAlias = (org: IScratchOrg): string => 'cli@hutte.io';
