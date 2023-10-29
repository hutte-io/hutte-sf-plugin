import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { IScratchOrg, getScratchOrgs } from '../../../api';
import { projectRepoFromOrigin } from '../../../common';
import { getApiToken } from '../../../config';

export class List extends SfCommand<IScratchOrg[]> {
  public static readonly summary = 'list hutte scratch orgs from current repository';

  static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: 'the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`',
    }),
    verbose: Flags.boolean({
      summary: 'includes all information of scratch org, such as auth url',
    }),
    all: Flags.boolean({
      summary:
        'when provided, the output includes all orgs from hutte project, otherwise (by default) only active orgs will be returned',
      default: false,
    }),
  };

  public async run(): Promise<IScratchOrg[]> {
    const { flags } = await this.parse(List);
    const repoName: string = projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await getApiToken());
    let result: IScratchOrg[] = await getScratchOrgs(apiToken, repoName, flags.all);
    if (!flags.verbose) {
      result = this.removeSensitiveInformation(result);
    }
    this.table(result, {
      projectName: { header: 'Project Name' },
      name: { header: 'Org Name' },
      state: { header: 'State' },
      branchName: { header: 'Branch Name' },
      remainingDays: { header: 'Remaining Days' },
      createdBy: { header: 'Created By' },
    });
    return result;
  }

  private removeSensitiveInformation(orgs: IScratchOrg[]): IScratchOrg[] {
    return orgs.map((org: IScratchOrg) => {
      return Object.fromEntries(
        Object.entries(org).filter(([key, value]) => !['devhubSfdxAuthUrl', 'sfdxAuthUrl'].includes(key)),
      ) as IScratchOrg; // not yet possible with TypeScript
    });
  }
}
