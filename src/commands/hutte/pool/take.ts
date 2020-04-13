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
    'api-token': flags.string({
      char: 't',
      description:
        'the api token. Only needed if you have not previously logged in using `sfdx hutte:auth:login`',
    }),
    name: flags.string({
      char: 'n',
      description: 'the name of the org',
    }),
    'project-id': flags.string({
      char: 'p',
      description:
        'the id of the project. Useful when multiple projects use the same git repository.',
    }),
    timeout: flags.integer({
      description: 'the timeout period in seconds.',
    }),
    wait: flags.boolean({
      char: 'w',
      description: 'waits until an org becomes available',
    }),
  };

  public async run(): Promise<void> {
    return this.take(0);
  }

  private async take(iteration: number): Promise<void> {
    return this.fetchOrg(iteration)
      .then((scratchOrg) => this.processOrg(scratchOrg))
      .then(() => Promise.resolve());
  }

  private async fetchOrg(iteration: number): Promise<IScratchOrg> {
    return projectRepoFromOrigin()
      .then((repoName) =>
        takeOrgFromPool(
          this.flags['api-token'],
          repoName,
          this.flags['project-id'],
          this.flags.name,
        ),
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
              if (this.flags.timeout && iteration * 10 > this.flags.timeout) {
                console.log('Timeout reached, finishing...');
                this.exit(1);
              }

              console.log(
                'There is no active pool at the moment. Trying again in 10 seconds.',
              );
              return new Promise(() =>
                setTimeout(() => this.take(iteration + 1), 10000),
              );
            }

            console.log(
              'There is no active pool at the moment, try again later.',
            );
          }
        } else {
          console.log('Uknown request error.', e);
        }

        console.log('Unknown error: ', e);
        this.exit(1);
      });
  }

  private processOrg(scratchOrg: IScratchOrg): Promise<IScratchOrg> {
    return devHubSfdxLogin(scratchOrg)
      .then(() => sfdxLogin(scratchOrg))
      .then(() => flagAsScratchOrg(scratchOrg));
  }
}
