import { execSync } from 'child_process';
import cross_spawn from 'cross-spawn';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseUrl } from 'url';
import { IScratchOrg } from './api';

const AUTH_URL_FILE = 'tmp_hutte_login';

export function sfdxLogin(org: IScratchOrg): IScratchOrg {
  writeFileSync(AUTH_URL_FILE, org.sfdxAuthUrl!);
  const response = cross_spawn.sync('sfdx', [
    'force:auth:sfdxurl:store',
    '-f',
    AUTH_URL_FILE,
    '-a',
    `hutte-${org.slug}`,
    '--setdefaultusername',
  ]);
  unlinkSync(AUTH_URL_FILE);
  if (response.status !== 0) {
    throw new Error('The sfdx login failed.');
  }
  if (org.revisionNumber) {
    cross_spawn.sync('sfdx', ['force:source:tracking:reset', '-r', org.revisionNumber, '-p']);
  }
  return org;
}

export function devHubSfdxLogin(org: IScratchOrg): void {
  writeFileSync(AUTH_URL_FILE, org.devhubSfdxAuthUrl!);
  const result = cross_spawn.sync('sfdx', ['force:auth:sfdxurl:store', '-f', AUTH_URL_FILE, '-a', devHubAlias(org)]);
  unlinkSync(AUTH_URL_FILE);
  if (result.status === 0) {
    return;
  }
  throw new Error('The devhub login failed.');
}

export function logoutFromDefault(): void {
  const result = cross_spawn.sync('sfdx', ['force:auth:logout', '-p']);
  if (result.status === 0) {
    return;
  }
  throw new Error('Failed logging out from the org');
}

export function flagAsScratchOrg(org: IScratchOrg): IScratchOrg {
  const orgInfo = getDefaultOrgInfo();
  const configFile = join(homedir(), '.sfdx', `${orgInfo.username}.json`);
  const config = JSON.parse(readFileSync(configFile).toString());
  writeFileSync(configFile, JSON.stringify({ ...config, devHubUsername: devHubAlias(org) }, null, 4));
  return org;
}

interface IDefaultOrgInfo {
  id: string;
  username: string;
}

export function getDefaultOrgInfo(): IDefaultOrgInfo {
  try {
    const data = JSON.parse(execSync('sfdx force:org:display --json').toString());
    return data.result;
  } catch {
    throw new Error('Error reading the default scratch org');
  }
}

export function projectRepoFromOrigin(): string {
  const gitConfigGetResult = cross_spawn.sync('git', ['config', '--get', 'remote.origin.url']);
  return extractGithubRepoName(gitConfigGetResult.stdout.toString());
}

export function extractGithubRepoName(remoteUrl: string): string {
  let url = parseUrl(remoteUrl).path!;
  if (url[0] === '/') {
    url = url.substr(1);
  }
  if (url.includes(':')) {
    url = url.slice(url.indexOf(':') + 1);
  }
  if (url.slice(-4) === '.git') {
    url = url.slice(0, -4);
  }
  return url;
}

export async function retryWithTimeout<T>(
  asyncFunction: () => Promise<T>,
  retryOnFunc: (e) => boolean,
  timeoutSeconds = 0,
  sleepSeconds = 10,
  iteration = 1,
): Promise<T> {
  try {
    return await asyncFunction();
  } catch (e) {
    if (retryOnFunc(e) && timeoutSeconds && iteration * sleepSeconds < timeoutSeconds) {
      await new Promise((resolve) => setTimeout(resolve, sleepSeconds * 1000));
      return await retryWithTimeout(asyncFunction, retryOnFunc, timeoutSeconds, sleepSeconds, iteration + 1);
    }
    throw e;
  }
}

const devHubAlias = (org: IScratchOrg): string => 'cli@hutte.io';
