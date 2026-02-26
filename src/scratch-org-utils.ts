import { Messages } from '@salesforce/core';
import { IScratchOrg } from './api.js';

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
