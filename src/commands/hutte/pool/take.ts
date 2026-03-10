import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IScratchOrg } from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';
import projectResolution from '../../../project-resolution.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.pool.take');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Take extends SfCommand<IScratchOrg> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
      env: 'HUTTE_PROJECT_ID',
    }),
    timeout: Flags.integer({
      summary: messages.getMessage('flags.timeout.summary'),
    }),
    wait: Flags.boolean({
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
    }),
  };

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Take);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);

    const scratchOrg = await common.retryWithTimeout(
      async () => api.takeOrgFromPool(apiToken, resolved, flags.name),
      (e) => typeof e === 'string' && e.includes('try again later'),
      flags.wait ? flags.timeout : 0
    );
    common.sfdxLogin(scratchOrg);
    return scratchOrg;
  }
}
