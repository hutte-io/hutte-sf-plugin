import { Messages } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import crossSpawn from 'cross-spawn';
import { IScratchOrg } from './api.js';
import common from './common.js';

export type HandleTerminalOrgOptions = {
  noGit?: boolean;
  noPull?: boolean;
};

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.scratch');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export function getTerminalStateError(org: IScratchOrg): Error {
  switch (org.state) {
    case 'failed':
      return messages.createError('error.orgCreationFailed');
    case 'setup_failed':
      return messages.createError('error.setupFailed');
    case 'push_failed':
      return messages.createError('error.pushFailed');
    default:
      return messages.createError('error.unexpectedState', [org.state]);
  }
}

export const scratchOrgTableColumns: Array<{ key: keyof IScratchOrg; name: string }> = [
  { key: 'id', name: 'Scratch Org Id' },
  { key: 'orgName', name: 'Org Name' },
  { key: 'projectName', name: 'Project Name' },
  { key: 'state', name: 'State' },
  { key: 'branchName', name: 'Branch Name' },
  { key: 'remainingDays', name: 'Remaining Days' },
  { key: 'createdBy', name: 'Created By' },
];

export function getMessage(key: string, tokens?: string[]): string {
  return messages.getMessage(key, tokens);
}

type AnySfCommand = SfCommand<unknown>;

export function displayOrgInfo(cmd: AnySfCommand, org: IScratchOrg): void {
  cmd.table({ data: [org], columns: scratchOrgTableColumns });
}

export function checkUnstagedChanges(): void {
  const result = crossSpawn.sync('git', ['diff-index', '--quiet', 'HEAD', '--']);
  if (result.status !== 0) {
    throw sharedMessages.createError('error.unstagedChanges');
  }
}

export function checkoutGitBranch(cmd: AnySfCommand, org: IScratchOrg): void {
  crossSpawn.sync('git', ['fetch', 'origin']);
  cmd.info(sharedMessages.getMessage('info.checkoutBranch', [org.branchName]));
  const checkoutResult = crossSpawn.sync('git', ['checkout', org.branchName]);
  if (checkoutResult.status !== 0) {
    cmd.info(sharedMessages.getMessage('info.creatingBranch', [org.commitSha]));
    crossSpawn.sync('git', ['checkout', org.commitSha]);
    crossSpawn.sync('git', ['checkout', '-b', org.branchName]);
  }
}

export function pullSource(cmd: AnySfCommand): void {
  cmd.spinner.start(sharedMessages.getMessage('spinner.pulling'));
  const result = crossSpawn.sync('sf', ['project', 'retrieve', 'start', '--ignore-conflicts']);
  cmd.spinner.stop();
  if (result.status !== 0) {
    throw new Error(result.output.join('\n'));
  }
}

export function handleTerminalOrg(
  cmd: AnySfCommand,
  org: IScratchOrg,
  successMessage: string,
  options?: HandleTerminalOrgOptions
): IScratchOrg {
  if (org.state !== 'active') {
    if (org.webUrl) {
      cmd.info(getMessage('info.viewDetailsInHutte', [org.webUrl]));
    }
    throw getTerminalStateError(org);
  }

  cmd.logSuccess(successMessage);
  if (org.webUrl) {
    cmd.info(getMessage('info.openInHutte', [org.webUrl]));
  }

  cmd.spinner.start(getMessage('spinner.authenticating'));
  common.sfdxLogin(org);
  cmd.spinner.stop();

  if (!options?.noGit) {
    checkUnstagedChanges();
    checkoutGitBranch(cmd, org);
  }

  if (!options?.noPull) {
    pullSource(cmd);
  }

  displayOrgInfo(cmd, org);
  return org;
}
