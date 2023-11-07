import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { IScratchOrg, takeOrgFromPool } from '../../../api';
import { devHubSfdxLogin, flagAsScratchOrg, projectRepoFromOrigin, retryWithTimeout, sfdxLogin } from '../../../common';
import { getApiToken } from '../../../config';

export class Take extends SfCommand<IScratchOrg> {
  public static readonly summary = 'take a scratch org from the pool';

  static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: 'the api token. Only needed if you have not previously logged in using `sf hutte auth login`',
    }),
    name: Flags.string({
      char: 'n',
      summary: 'the name of the org',
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: 'the id of the project. Useful when multiple projects use the same git repository.',
    }),
    timeout: Flags.integer({
      summary: 'the timeout period in seconds.',
    }),
    wait: Flags.boolean({
      char: 'w',
      summary: 'waits until an org becomes available',
    }),
  };

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Take);
    const repoName = projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await getApiToken());

    const scratchOrg = await retryWithTimeout(
      async () => {
        return await takeOrgFromPool(apiToken, repoName, flags['project-id'], flags.name);
      },
      (e) => /try again later/.test(e),
      flags.wait ? flags.timeout : 0,
    );
    this.processOrg(scratchOrg);
    return scratchOrg;
  }

  private processOrg(scratchOrg: IScratchOrg): IScratchOrg {
    devHubSfdxLogin(scratchOrg);
    sfdxLogin(scratchOrg);
    return flagAsScratchOrg(scratchOrg);
  }
}
