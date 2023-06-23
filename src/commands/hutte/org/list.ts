import { flags, SfdxCommand } from '@salesforce/command';

import { getScratchOrgs, IScratchOrg } from '../../../api';
import { projectRepoFromOrigin } from '../../../common';

export default class List extends SfdxCommand {
  public static description = 'list hutte scratch orgs from current repository';

  static requiresProject = true;

  protected static flagsConfig = {
    verbose: flags.builtin({
      description: 'includes all information of scratch org, such as auth url'
    })
  };
  
  public async run(): Promise<IScratchOrg[]> {
    const repoName: string = await projectRepoFromOrigin();
    let result: IScratchOrg[] = await getScratchOrgs(repoName);
    
    if (!this.flags['verbose']) {
        this.removeSensitiveInformation(result);
    }

    this.ux.table(result, {columns: [
        {key: 'projectName', label: 'Project Name'},
        {key: 'name', label: 'Org Name'},
        {key: 'state', label: 'State'},
        {key: 'branchName', label: 'Branch Name'},
        {key: 'remainingDays', label: 'Remaining Days'},
        {key: 'createdBy', label: 'Created By'}
      ]});

    return result;
  }

  private removeSensitiveInformation(orgs: IScratchOrg[]) {
    orgs.forEach((orgDetails) => {
        delete orgDetails.devhubSfdxAuthUrl;
        delete orgDetails.sfdxAuthUrl;
    });
  }
}
