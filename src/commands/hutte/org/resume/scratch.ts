import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IScratchOrg } from '../../../../api.js';
import common from '../../../../common.js';
import config from '../../../../config.js';
import {
  getTerminalStateError,
  scratchOrgTableColumns,
  getMessage as getSharedMessage,
} from '../../../../scratch-org-utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.resume.scratch');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Scratch extends SfCommand<IScratchOrg> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly requiresProject = true;

  public static readonly flags = {
    'scratch-org-id': Flags.string({
      char: 'i',
      required: true,
      summary: messages.getMessage('flags.scratch-org-id.summary'),
    }),
    wait: Flags.integer({
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
      default: 10,
    }),
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
    }),
  };

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Scratch);
    const repoName = common.projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const orgId = flags['scratch-org-id'];

    const currentOrg = await api.getScratchOrg(apiToken, repoName, orgId);

    if (common.isTerminalState(currentOrg.state)) {
      return this.handleTerminalOrg(currentOrg, messages.getMessage('info.alreadyActive', [currentOrg.orgName]));
    }

    const timeoutMs = flags.wait * 60 * 1000;
    const intervalMs = 5000;

    this.spinner.start(messages.getMessage('spinner.polling'));

    const finalOrg = await common.pollForOrgStatus(() => api.getScratchOrg(apiToken, repoName, orgId), {
      timeoutMs,
      intervalMs,
      onStatusChange: (status) => {
        this.spinner.status = getSharedMessage('info.status', [status]);
      },
      timeoutActions: [getSharedMessage('info.increaseWaitHint')],
    });

    this.spinner.stop();

    return this.handleTerminalOrg(finalOrg, getSharedMessage('info.orgReady', [finalOrg.orgName]));
  }

  private handleTerminalOrg(org: IScratchOrg, successMessage: string): IScratchOrg {
    if (org.state !== 'active') {
      if (org.webUrl) {
        this.info(getSharedMessage('info.viewDetailsInHutte', [org.webUrl]));
      }
      throw getTerminalStateError(org);
    }

    this.logSuccess(successMessage);
    if (org.webUrl) {
      this.info(getSharedMessage('info.openInHutte', [org.webUrl]));
    }

    this.spinner.start(getSharedMessage('spinner.authenticating'));
    common.sfdxLogin(org);
    this.spinner.stop();

    this.displayOrgInfo(org);
    return org;
  }

  private displayOrgInfo(org: IScratchOrg): void {
    this.table({
      data: [org],
      columns: scratchOrgTableColumns,
    });
  }
}
