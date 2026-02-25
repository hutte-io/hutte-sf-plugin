import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IScratchOrg } from '../../../../api.js';
import common from '../../../../common.js';
import config from '../../../../config.js';

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

  private static handleTerminalState(org: IScratchOrg): void {
    switch (org.state) {
      case 'failed':
        throw messages.createError('error.orgCreationFailed');
      case 'setup_failed':
        throw messages.createError('error.setupFailed');
      case 'push_failed':
        throw messages.createError('error.pushFailed');
      default:
        break;
    }
  }

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Scratch);
    const repoName = common.projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const orgId = flags['scratch-org-id'];

    const currentOrg = await api.getScratchOrg(apiToken, repoName, orgId);

    if (common.isTerminalState(currentOrg.state)) {
      if (currentOrg.state === 'active') {
        this.info(messages.getMessage('info.alreadyActive', [currentOrg.orgName]));

        this.spinner.start(messages.getMessage('spinner.authenticating'));
        common.sfdxLogin(currentOrg);
        this.spinner.stop();

        this.displayOrgInfo(currentOrg);
        return currentOrg;
      }

      Scratch.handleTerminalState(currentOrg);
    }

    const timeoutMs = flags.wait * 60 * 1000;
    const intervalMs = 5000;

    this.spinner.start(messages.getMessage('spinner.polling'));

    const finalOrg = await common.pollForOrgStatus(() => api.getScratchOrg(apiToken, repoName, orgId), {
      timeoutMs,
      intervalMs,
      onStatusChange: (status) => {
        this.spinner.status = messages.getMessage('info.status', [status]);
      },
    });

    this.spinner.stop();

    Scratch.handleTerminalState(finalOrg);

    this.info(messages.getMessage('info.orgReady', [finalOrg.orgName]));

    this.spinner.start(messages.getMessage('spinner.authenticating'));
    common.sfdxLogin(finalOrg);
    this.spinner.stop();

    this.displayOrgInfo(finalOrg);
    return finalOrg;
  }

  private displayOrgInfo(org: IScratchOrg): void {
    this.table({
      data: [org],
      columns: [
        { key: 'id', name: 'Scratch Org Id' },
        { key: 'orgName', name: 'Org Name' },
        { key: 'state', name: 'State' },
        { key: 'branchName', name: 'Branch Name' },
        { key: 'remainingDays', name: 'Remaining Days' },
      ],
    });
  }
}
