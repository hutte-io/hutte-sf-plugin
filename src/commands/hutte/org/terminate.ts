import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';
import projectResolution from '../../../project-resolution.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.terminate');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Terminate extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
      env: 'HUTTE_PROJECT_ID',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Terminate);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);
    const orgInfo = common.getDefaultOrgInfo();
    await api.terminateOrg(apiToken, resolved, orgInfo.id);
    common.logoutFromDefault();
  }
}
