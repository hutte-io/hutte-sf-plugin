import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import chalk from 'chalk';
import Fuse from 'fuse.js';
import { search as searchPrompt } from '@inquirer/prompts';
import api, { IScratchOrg } from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';
import projectResolution from '../../../project-resolution.js';
import { checkUnstagedChanges, checkoutGitBranch, pullSource } from '../../../scratch-org-utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.authorize');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Authorize extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    'no-git': Flags.boolean({
      default: false,
      summary: messages.getMessage('flags.no-git.summary'),
    }),
    'no-pull': Flags.boolean({
      default: false,
      summary: messages.getMessage('flags.no-pull.summary'),
    }),
    'org-name': Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.org-name.summary'),
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Authorize);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);
    const scratchOrgs: IScratchOrg[] = await api.getScratchOrgs(apiToken, resolved);
    const scratchOrg: IScratchOrg = flags['org-name']
      ? this.findScratchOrg(scratchOrgs, flags['org-name'])
      : await this.chooseScratchOrg(scratchOrgs);
    if (!flags['no-git']) {
      checkUnstagedChanges();
      checkoutGitBranch(this, scratchOrg);
    }
    common.sfdxLogin(scratchOrg);
    if (!flags['no-pull']) {
      pullSource(this);
    }
  }

  private findScratchOrg(scratchOrgs: IScratchOrg[], nameToFind: string): IScratchOrg {
    this.debug(`Finding scratch org with name: ${nameToFind}`);
    const result = scratchOrgs.find((scratchOrg: IScratchOrg) => scratchOrg.orgName === nameToFind);
    if (!result) {
      throw messages.createError('error.orgNotFound');
    }
    return result;
  }

  private async chooseScratchOrg(orgs: IScratchOrg[]): Promise<IScratchOrg> {
    this.debug(`Choosing from ${orgs.length} scratch orgs`);
    if (orgs.length === 0) {
      throw messages.createError('error.noOrgsToAuthorize');
    }
    if (orgs.length === 1) {
      return orgs[0];
    }

    const answer = await searchPrompt({
      message: messages.getMessage('prompt.chooseOrg'),
      source: (term) => {
        let filtered = orgs;
        if (term) {
          const fuse = new Fuse(orgs, { keys: ['orgName'], threshold: 0.3 });
          filtered = fuse.search(term).map((result) => result.item);
        }
        return filtered.map((org) => ({
          value: org.id,
          name: `${org.orgName} ${chalk.gray(`- ${org.projectName}`)}`,
        }));
      },
    });
    const selectedOrg = orgs.find((org) => org.id === answer);
    if (!selectedOrg) {
      throw messages.createError('error.noOrgSelected');
    }
    return selectedOrg;
  }
}
