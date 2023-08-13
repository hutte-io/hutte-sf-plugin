import { flags, SfdxCommand } from '@salesforce/command';

import chalk from 'chalk';
import cross_spawn from 'cross-spawn';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';

import { SfdxError } from '@salesforce/core';
import { getScratchOrgs, IScratchOrg } from '../../../api';
import {
  devHubSfdxLogin,
  flagAsScratchOrg,
  projectRepoFromOrigin,
  sfdxLogin,
} from '../../../common';

export default class Authorize extends SfdxCommand {
  public static description = 'authorize a scratch org from hutte.io';

  static requiresProject = true;

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
    return this.checkUnstagedChanges()
      .then(() => projectRepoFromOrigin())
      .then((repoName) => getScratchOrgs(repoName))
      .then((scratchOrgs) => this.chooseScratchOrg(scratchOrgs))
      .then((scratchOrg) => devHubSfdxLogin(scratchOrg))
      .then((scratchOrg) => sfdxLogin(scratchOrg))
      .then((scratchOrg) => flagAsScratchOrg(scratchOrg))
      .then((scratchOrg) => this.checkoutGitBranch(scratchOrg))
      .then((scratchOrg) => this.sfdxPull(scratchOrg))
      .then(() => Promise.resolve());
  }

  private checkUnstagedChanges(): Promise<void> {
    if (this.flags['no-git']) {
      return Promise.resolve();
    }

    const result = cross_spawn.sync('git', [
      'diff-index',
      '--quiet',
      'HEAD',
      '--',
    ]);

    if (result.status !== 0) {
      return Promise.reject(
        SfdxError.wrap(
          `You have unstaged changes. Please commit or stash them before proceeding.`,
        ),
      );
    }

    return Promise.resolve();
  }

  private sfdxPull(org: IScratchOrg): Promise<IScratchOrg> {
    if (this.flags['no-pull']) {
      return Promise.resolve(org);
    }
    const ret = cross_spawn.sync('sfdx', ['force:source:pull', '-f']);

    if (ret.status !== 0) {
      return Promise.reject(SfdxError.wrap(ret.output.join('\n')));
    }

    return Promise.resolve(org);
  }

  private async chooseScratchOrg(orgs: IScratchOrg[]): Promise<IScratchOrg> {
    if (orgs.length === 0) {
      return Promise.reject(
        "You don't have any scratch orgs to authorize. Access https://app.hutte.io to create one",
      );
    }

    if (orgs.length === 1) {
      return Promise.resolve(orgs[0]);
    }

    inquirer.registerPrompt(
      'autocomplete',
      require('inquirer-autocomplete-prompt'),
    );
    const answer = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'scratch_org',
        message: 'Which scratch org would you like to authorize?',
        source: (_answers: any, input: string) => {
          let filtered = orgs;

          if (input) {
            filtered = fuzzy
              .filter(input, orgs, {
                extract: (org) => org.name,
              })
              .map((value) => value.original);
          }

          return Promise.resolve(
            filtered.map((org) => ({
              value: org.id,
              name: `${org.name} ${chalk.gray(`- ${org.projectName}`)}`,
            })),
          );
        },
      },
    ]);

    const selectedOrg = orgs.find((org) => org.id === answer.scratch_org);

    if (!selectedOrg) {
      process.exit(0);
    }

    return Promise.resolve(selectedOrg);
  }

  private checkoutGitBranch(org: IScratchOrg): Promise<IScratchOrg> {
    if (this.flags['no-git']) {
      return Promise.resolve(org);
    }

    cross_spawn.sync('git', ['fetch', 'origin']);

    this.logger.info(`Checking out remote branch ${org.branchName}`);

    const checkoutResult = cross_spawn.sync('git', [
      'checkout',
      org.branchName,
    ]);

    if (checkoutResult.status !== 0) {
      this.logger.info(
        `Remote org does not exist. Creating based on ${org.commitSha}...`,
      );

      cross_spawn.sync('git', ['checkout', org.commitSha]);
      cross_spawn.sync('git', ['checkout', '-b', org.branchName]);
    }

    return Promise.resolve(org);
  }
}
