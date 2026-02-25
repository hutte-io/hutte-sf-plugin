import { execSync } from 'node:child_process';
import { parse as parseUrl } from 'node:url';
import crossSpawn from 'cross-spawn';
import { Messages } from '@salesforce/core';
import { IScratchOrg } from './api.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.common');

function sfdxLogin(org: IScratchOrg): IScratchOrg {
  const response = crossSpawn.sync(
    'sf',
    ['org', 'login', 'sfdx-url', '--alias', `hutte-${org.slug}`, '--set-default', '--sfdx-url-stdin'],
    {
      input: org.sfdxAuthUrl!,
    }
  );
  if (response.status !== 0) {
    throw messages.createError('error.loginFailed');
  }
  if (org.revisionNumber) {
    crossSpawn.sync('sf', ['project', 'reset', 'tracking', '--revision', org.revisionNumber, '--no-prompt']);
  }
  return org;
}

function logoutFromDefault(): void {
  const result = crossSpawn.sync('sf', ['org', 'logout', '--no-prompt']);
  if (result.status === 0) {
    return;
  }
  throw messages.createError('error.logoutFailed');
}

type IDefaultOrgInfo = {
  id: string;
  username: string;
};

function getDefaultOrgInfo(): IDefaultOrgInfo {
  try {
    const data = JSON.parse(execSync('sf org display --json').toString()) as { result: IDefaultOrgInfo };
    return data.result;
  } catch {
    throw messages.createError('error.readDefaultOrg');
  }
}

function projectRepoFromOrigin(): string {
  const gitConfigGetResult = crossSpawn.sync('git', ['config', '--get', 'remote.origin.url']);
  return extractGithubRepoName(gitConfigGetResult.stdout.toString());
}

function extractGithubRepoName(remoteUrl: string): string {
  let url = parseUrl(remoteUrl).path!;
  if (url.startsWith('/')) {
    url = url.substr(1);
  }
  if (url.includes(':')) {
    url = url.slice(url.indexOf(':') + 1);
  }
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }
  // the last two parts of the url path
  const repoName = url.split('/').slice(-2).join('/');
  return repoName;
}

async function retryWithTimeout<T>(
  asyncFunction: () => Promise<T>,
  retryOnFunc: (e: unknown) => boolean,
  timeoutSeconds = 0,
  sleepSeconds = 10,
  iteration = 1
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

export default {
  sfdxLogin,
  logoutFromDefault,
  getDefaultOrgInfo,
  projectRepoFromOrigin,
  extractGithubRepoName,
  retryWithTimeout,
};
