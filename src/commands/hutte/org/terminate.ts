import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { terminateOrg } from '../../../api';
import { getDefaultOrgInfo, logoutFromDefault, projectRepoFromOrigin } from '../../../common';
import { getApiToken } from '../../../config';

export class Terminate extends SfCommand<void> {
  public static readonly summary = 'terminates the default org on Hutte.io and logs out locally';

  static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: 'the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Terminate);
    const repoName = projectRepoFromOrigin();
    const orgInfo = getDefaultOrgInfo();
    const apiToken = flags['api-token'] ?? (await getApiToken());
    const terminateResponse = await terminateOrg(apiToken, repoName, orgInfo.id);
    if (terminateResponse.response.statusCode === 404) {
      throw new Error('Could not find the scratch org on hutte. Are you sure you are in the correct project?');
    }
    if (Math.floor(terminateResponse.response.statusCode / 100) !== 2) {
      throw new Error(
        'Request to hutte failed ' + terminateResponse.response.statusCode + ' ' + terminateResponse.body,
      );
    }
    logoutFromDefault();
  }
}
