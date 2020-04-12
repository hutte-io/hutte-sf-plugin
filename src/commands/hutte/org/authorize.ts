import { flags, SfdxCommand } from '@salesforce/command';

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as cross_spawn from 'cross-spawn';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
import { keyInSelect } from 'readline-sync';

import { getScratchOrgs, IScratchOrg } from '../../../api';
import {
  devHubSfdxLogin,
  flagAsScratchOrg,
  projectRepoFromOrigin,
  sfdxLogin,
} from '../../../common';

export default class Login extends SfdxCommand {
  public static description = 'authorize a scratch org from hutte.io';

  protected static requiresProject = true;

  protected static flagsConfig = {
    'no-git': flags.boolean({
      default: false,
      description: "doesn't checkout the scratch org's git branch",
    }),
    'no-pull': flags.boolean({
      default: false,
      description: "doesn't pull the source code from the scratch org",
    }),
  };

  public async run(): Promise<void> {
    return projectRepoFromOrigin()
      .then((repoName) => getScratchOrgs(repoName))
      .then((scratchOrgs) => this.chooseScratchOrg(scratchOrgs))
      .then((scratchOrg) => devHubSfdxLogin(scratchOrg))
      .then((scratchOrg) => sfdxLogin(scratchOrg))
      .then((scratchOrg) => flagAsScratchOrg(scratchOrg))
      .then((scratchOrg) => this.checkoutGitBranch(scratchOrg))
      .then((scratchOrg) => this.sfdxPull(scratchOrg))
      .then((scratchOrg) => this.markFilesAsUnchanged(scratchOrg))
      .then(() => Promise.resolve());
  }

  private sfdxPull(org: IScratchOrg): Promise<IScratchOrg> {
    if (this.flags['no-pull']) {
      return Promise.resolve(org);
    }

    return new Promise((resolve, reject) => {
      const child = cross_spawn('sfdx', ['force:source:pull']);

      child.on('close', (code) => {
        resolve(org);
      });
    });
  }

  private markFilesAsUnchanged(org: IScratchOrg): Promise<IScratchOrg> {
    if (this.flags['no-pull']) {
      return Promise.resolve(org);
    }

    const orgInfo = JSON.parse(
      execSync('sfdx force:org:display --json').toString(),
    );
    const configFile = joinPath(
      process.cwd(),
      '.sfdx',
      'orgs',
      orgInfo.result.username,
      'sourcePathInfos.json',
    );

    if (!existsSync(configFile)) {
      return Promise.resolve(org);
    }

    const config = JSON.parse(
      readFileSync(configFile).toString(),
    ).map((row) => [row[0], { ...row[1], state: 'u' }]);

    writeFileSync(configFile, JSON.stringify(config, null, 4));

    return Promise.resolve(org);
  }

  private chooseScratchOrg(orgs: IScratchOrg[]): Promise<IScratchOrg> {
    if (orgs.length === 0) {
      return Promise.reject(
        "You don't have any scratch orgs to authorize. Access https://app.hutte.io to create one",
      );
    }

    if (orgs.length === 1) {
      return Promise.resolve(orgs[0]);
    }

    const index = keyInSelect(
      orgs.map((org) => `${org.name} ${chalk.gray(`- ${org.projectName}`)}`),
      'Which scratch org?',
      {
        cancel: 'Cancel',
      },
    );

    if (index === -1) {
      process.exit(0);
    }

    return Promise.resolve(orgs[index]);
  }

  private checkoutGitBranch(org: IScratchOrg): Promise<IScratchOrg> {
    if (this.flags['no-git']) {
      return Promise.resolve(org);
    }

    execSync(
      `git fetch origin && git checkout ${org.branchName} || git checkout -b ${org.branchName}`,
    );
    return Promise.resolve(org);
  }
}
