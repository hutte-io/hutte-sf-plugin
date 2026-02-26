import { execSync } from 'node:child_process';
import { parse as parseUrl } from 'node:url';
import crossSpawn from 'cross-spawn';
import { Messages } from '@salesforce/core';
import { IScratchOrg } from './api.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.common');

const TERMINAL_STATES = ['active', 'failed', 'setup_failed', 'push_failed'];

export type PollOptions = {
  timeoutMs: number;
  intervalMs: number;
  onStatusChange?: (status: string) => void;
  timeoutActions?: string[];
};

function isTerminalState(state: string): boolean {
  return TERMINAL_STATES.includes(state);
}

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

async function pollForOrgStatus(fetchOrg: () => Promise<IScratchOrg>, options: PollOptions): Promise<IScratchOrg> {
  const { timeoutMs, intervalMs, onStatusChange, timeoutActions } = options;
  const startTime = Date.now();
  let lastStatus = '';

  /* eslint-disable no-await-in-loop */
  while (Date.now() - startTime < timeoutMs) {
    const org = await fetchOrg();

    if (org.state !== lastStatus) {
      lastStatus = org.state;
      if (onStatusChange) {
        onStatusChange(org.state);
      }
    }

    if (isTerminalState(org.state)) {
      return org;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  /* eslint-enable no-await-in-loop */

  const error = messages.createError('error.pollTimeout');
  if (timeoutActions) {
    error.actions = timeoutActions;
  }
  throw error;
}

function getCurrentBranch(): string {
  try {
    const result = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' });
    return result.trim();
  } catch {
    throw messages.createError('error.gitBranchFailed');
  }
}

export default {
  sfdxLogin,
  logoutFromDefault,
  getDefaultOrgInfo,
  projectRepoFromOrigin,
  extractGithubRepoName,
  retryWithTimeout,
  pollForOrgStatus,
  getCurrentBranch,
  isTerminalState,
  TERMINAL_STATES,
};
