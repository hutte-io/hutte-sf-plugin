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

export const logoutFromDefault = async () =>
  new Promise<void>((resolve, reject) => {
    const child = cross_spawn('sfdx', ['force:auth:logout', '-p']);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject('Failed logging out from the org');
      }
    });
  });

export const flagAsScratchOrg = async (
  org: IScratchOrg,
): Promise<IScratchOrg> => {
  const orgInfo = await getDefaultOrgInfo();

  const configFile = join(homedir(), '.sfdx', `${orgInfo.username}.json`);

  const config = JSON.parse(readFileSync(configFile).toString());

  writeFileSync(
    configFile,
    JSON.stringify({ ...config, devHubUsername: devHubAlias(org) }, null, 4),
  );

  return Promise.resolve(org);
};

interface IDefaultOrgInfo {
  id: string;
  username: string;
}

export const getDefaultOrgInfo = async (): Promise<IDefaultOrgInfo> =>
  new Promise((resolve, reject) => {
    const data = JSON.parse(
      execSync('sfdx force:org:display --json').toString(),
    );

    if (data.status === 1) {
      return reject('Error reading the default scratch org');
    }

    return resolve(data.result);
  });

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
