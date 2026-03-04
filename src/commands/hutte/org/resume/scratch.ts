import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IScratchOrg } from '../../../../api.js';
import common from '../../../../common.js';
import config from '../../../../config.js';
import projectResolution from '../../../../project-resolution.js';
import { handleTerminalOrg, getMessage as getSharedMessage } from '../../../../scratch-org-utils.js';

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
    'no-git': Flags.boolean({
      default: false,
      summary: sharedMessages.getMessage('flags.no-git.summary'),
    }),
    'no-pull': Flags.boolean({
      default: false,
      summary: sharedMessages.getMessage('flags.no-pull.summary'),
    }),
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
    }),
  };

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Scratch);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);
    const orgId = flags['scratch-org-id'];

    const currentOrg = await api.getScratchOrg(apiToken, resolved, orgId);

    if (common.isTerminalState(currentOrg.state)) {
      return handleTerminalOrg(this, currentOrg, messages.getMessage('info.alreadyActive', [currentOrg.orgName]), {
        noGit: flags['no-git'],
        noPull: flags['no-pull'],
      });
    }

    const timeoutMs = flags.wait * 60 * 1000;
    const intervalMs = 5000;

    this.spinner.start(messages.getMessage('spinner.polling'));

    const finalOrg = await common.pollForOrgStatus(() => api.getScratchOrg(apiToken, resolved, orgId), {
      timeoutMs,
      intervalMs,
      onStatusChange: (status) => {
        this.spinner.status = getSharedMessage('info.status', [status]);
      },
      timeoutActions: [getSharedMessage('info.increaseWaitHint')],
    });

    this.spinner.stop();

    return handleTerminalOrg(this, finalOrg, getSharedMessage('info.orgReady', [finalOrg.orgName]), {
      noGit: flags['no-git'],
      noPull: flags['no-pull'],
    });
  }
}
