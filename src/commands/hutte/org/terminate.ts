import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import api from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';

export class Terminate extends SfCommand<void> {
  public static readonly summary = 'terminates the default org on Hutte.io and logs out locally';

  static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: 'the api token. Only needed if you have not previously logged in using `sf hutte auth login`',
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: 'the id of the project. Useful when multiple projects use the same git repository.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Terminate);
    const repoName = common.projectRepoFromOrigin();
    const orgInfo = common.getDefaultOrgInfo();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    await api.terminateOrg(apiToken, repoName, orgInfo.id, flags['project-id']);
    common.logoutFromDefault();
  }
}
