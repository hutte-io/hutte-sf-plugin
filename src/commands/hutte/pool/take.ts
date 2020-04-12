import { flags, SfdxCommand } from '@salesforce/command';

import { IScratchOrg, takeOrgFromPool } from '../../../api';
import {
  devHubSfdxLogin,
  flagAsScratchOrg,
  projectRepoFromOrigin,
  sfdxLogin,
} from '../../../common';

export default class Take extends SfdxCommand {
  public static description = 'take a scratch org from the pool';

  protected static requiresProject = true;

  protected static flagsConfig = {
    name: flags.string({
      char: 'n',
      description: 'the name of the org',
    }),
    'project-id': flags.string({
      char: 'p',
      description:
        'the id of the project. Useful when multiple projects use the same git repository.',
    }),
    wait: flags.boolean({
      char: 'w',
      description: 'waits until an org becomes available',
    }),
  };

  public async run(): Promise<void> {
    return this.fetchOrg()
      .then((scratchOrg) => this.processOrg(scratchOrg))
      .then(() => Promise.resolve());
  }

  private async fetchOrg(): Promise<IScratchOrg> {
    return projectRepoFromOrigin()
      .then((repoName) =>
        takeOrgFromPool(repoName, this.flags['project-id'], this.flags.name),
      )
      .catch((e) => {
        const { body } = e;

        if (body && body.error) {
          if (body.error === 'no_pool') {
            console.log(
              "This project doesn't have a pool defined. Setup a pool with at least one organization and try again.",
            );
          } else if (body.error === 'no_active_org') {
            if (this.flags.wait) {
              console.log(
                'There is no active pool at the moment. Trying again in 10 seconds.',
              );
              return new Promise(() => setTimeout(() => this.run(), 10000));
            }

            console.log(
              'There is no active pool at the moment, try again later.',
            );
          }
        } else {
          console.log('Uknown error.', e);
        }

        return Promise.reject(body);
      });
  }

  private processOrg(scratchOrg: IScratchOrg): Promise<IScratchOrg> {
    return devHubSfdxLogin(scratchOrg)
      .then(() => sfdxLogin(scratchOrg))
      .then(() => flagAsScratchOrg(scratchOrg));
  }
}
