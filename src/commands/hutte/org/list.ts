import { flags, SfdxCommand } from '@salesforce/command';

import { getScratchOrgs, IScratchOrg } from '../../../api';
import { projectRepoFromOrigin } from '../../../common';

export default class List extends SfdxCommand {
  public static description = 'list hutte scratch orgs from current repository';

  static requiresProject = true;

  protected static flagsConfig = {
    includeauth: flags.boolean({
      default: false,
      description: "includes all information of scratch org, such as auth url",
    })
  };

  public async run(): Promise<IScratchOrg[]> {
    const repoName: string = await projectRepoFromOrigin();
    let result: IScratchOrg[] = await getScratchOrgs(repoName);
    
    if (!this.flags['includeauth']) {
        this.removeSensitiveInformation(result);
    }

    return result;
  }

  private removeSensitiveInformation(orgs: IScratchOrg[]) {
    orgs.forEach((orgDetails) => {
        delete orgDetails.devhubSfdxAuthUrl;
        delete orgDetails.sfdxAuthUrl;
    });
  }
}
