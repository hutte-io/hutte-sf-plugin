import { Messages } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { IScratchOrg } from './api.js';
import common from './common.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.scratch');

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

export function displayOrgInfo(cmd: SfCommand<IScratchOrg>, org: IScratchOrg): void {
  cmd.table({ data: [org], columns: scratchOrgTableColumns });
}

export function handleTerminalOrg(cmd: SfCommand<IScratchOrg>, org: IScratchOrg, successMessage: string): IScratchOrg {
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

  displayOrgInfo(cmd, org);
  return org;
}
