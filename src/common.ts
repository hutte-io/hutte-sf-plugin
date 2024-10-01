import { execSync } from 'child_process';
import cross_spawn from 'cross-spawn';
import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseUrl } from 'url';
import { IScratchOrg } from './api';

export function sfdxLogin(org: IScratchOrg): IScratchOrg {
  const response = cross_spawn.sync(
    'sf',
    ['org', 'login', 'sfdx-url', '--alias', `hutte-${org.slug}`, '--set-default', '--sfdx-url-stdin'],
    {
      input: org.sfdxAuthUrl!,
    },
  );
  if (response.status !== 0) {
    throw new Error('The login failed.');
  }
  if (org.revisionNumber) {
    cross_spawn.sync('sf', ['project', 'reset', 'tracking', '--revision', org.revisionNumber, '--no-prompt']);
  }
  return org;
}

export function devHubSfdxLogin(org: IScratchOrg): void {
  const result = cross_spawn.sync('sf', ['org', 'login', 'sfdx-url', '--alias', devHubAlias(org), '--sfdx-url-stdin'], {
    input: org.devhubSfdxAuthUrl!,
  });
  if (result.status === 0) {
    return;
  }
  throw new Error('The devhub login failed.');
}

export function logoutFromDefault(): void {
  const result = cross_spawn.sync('sf', ['org', 'logout', '--no-prompt']);
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
    const data = JSON.parse(execSync('sf org display --json').toString());
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
  // the last two parts of the url path
  const repoName = url.split('/').slice(-2).join('/');
  return repoName;
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
