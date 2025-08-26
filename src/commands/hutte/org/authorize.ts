import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import chalk from 'chalk';
import cross_spawn from 'cross-spawn';
import fuzzy from 'fuzzy';
import { search as searchPrompt } from '@inquirer/prompts';
import api, { IScratchOrg } from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';

export class Authorize extends SfCommand<void> {
  public static readonly summary = 'authorize a scratch org from hutte.io';

  static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: 'the api token. Only needed if you have not previously logged in using `sf hutte auth login`',
    }),
    'no-git': Flags.boolean({
      default: false,
      summary: "doesn't checkout the scratch org's git branch",
    }),
    'no-pull': Flags.boolean({
      default: false,
      summary: "doesn't pull the source code from the scratch org",
    }),
    'org-name': Flags.string({
      char: 'n',
      summary: 'the name of the org to authorize',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Authorize);
    const repoName = common.projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const scratchOrgs: IScratchOrg[] = await api.getScratchOrgs(apiToken, repoName);
    const scratchOrg: IScratchOrg = flags['org-name']
      ? this.findScratchOrg(scratchOrgs, flags['org-name'])
      : await this.chooseScratchOrg(scratchOrgs);
    if (!flags['no-git']) {
      this.checkUnstagedChanges();
      this.checkoutGitBranch(scratchOrg);
    }
    common.sfdxLogin(scratchOrg);
    if (!flags['no-pull']) {
      this.sfdxPull(scratchOrg);
    }
  }

  private findScratchOrg(scratchOrgs: IScratchOrg[], nameToFind: string): IScratchOrg {
    const result = scratchOrgs.find((scratchOrg: IScratchOrg) => scratchOrg.orgName == nameToFind);
    if (!result) {
      throw new Error(
        'There is not any scratch org to authorize by the provided name. \nRemove this flag to choose it from a list or access https://app.hutte.io to see the available orgs.',
      );
    }
    return result;
  }

  private checkUnstagedChanges(): void {
    const result = cross_spawn.sync('git', ['diff-index', '--quiet', 'HEAD', '--']);
    if (result.status !== 0) {
      throw new Error('You have unstaged changes. Please commit or stash them before proceeding.');
    }
  }

  private sfdxPull(org: IScratchOrg): IScratchOrg {
    const ret = cross_spawn.sync('sf', ['project', 'retrieve', 'start', '--ignore-conflicts']);
    if (ret.status !== 0) {
      throw new Error(ret.output.join('\n'));
    }
    return org;
  }

  private async chooseScratchOrg(orgs: IScratchOrg[]): Promise<IScratchOrg> {
    if (orgs.length === 0) {
      throw new Error("You don't have any scratch orgs to authorize. Access https://app.hutte.io to create one");
    }
    if (orgs.length === 1) {
      return orgs[0];
    }

    const answer = await searchPrompt(
      {
        message: 'Which scratch org would you like to authorize?',
        source: (term) => {
          let filtered = orgs;
          if (term) {
            filtered = fuzzy
              .filter(term, orgs, {
                extract: (org) => org.orgName,
              })
              .map((value) => value.original);
          }
          return filtered.map((org) => ({
            value: org.id,
            name: `${org.orgName} ${chalk.gray(`- ${org.projectName}`)}`,
          }));
        },
      },
    );
    const selectedOrg = orgs.find((org) => org.id === answer);
    if (!selectedOrg) {
      throw new Error('No org selected!');
    }
    return selectedOrg;
  }

  private checkoutGitBranch(org: IScratchOrg): IScratchOrg {
    cross_spawn.sync('git', ['fetch', 'origin']);
    this.info(`Checking out remote branch ${org.branchName}`);
    const checkoutResult = cross_spawn.sync('git', ['checkout', org.branchName]);
    if (checkoutResult.status !== 0) {
      this.info(`Remote branch does not exist. Creating based on ${org.commitSha}...`);
      cross_spawn.sync('git', ['checkout', org.commitSha]);
      cross_spawn.sync('git', ['checkout', '-b', org.branchName]);
    }
    return org;
  }
}
