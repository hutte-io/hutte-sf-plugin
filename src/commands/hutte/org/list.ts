import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IScratchOrg } from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';
import { scratchOrgTableColumns } from '../../../scratch-org-utils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.list');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class List extends SfCommand<IScratchOrg[]> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly requiresProject = true;

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
    }),
    verbose: Flags.boolean({
      summary: messages.getMessage('flags.verbose.summary'),
    }),
    all: Flags.boolean({
      summary: messages.getMessage('flags.all.summary'),
      default: false,
    }),
  };

  public async run(): Promise<IScratchOrg[]> {
    const { flags } = await this.parse(List);
    const repoName: string = common.projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    let result: IScratchOrg[] = await api.getScratchOrgs(apiToken, repoName, flags.all);
    if (!flags.verbose) {
      result = this.removeSensitiveInformation(result);
    }
    this.table({
      data: result,
      columns: scratchOrgTableColumns.map((col) => ({ key: col.key, name: col.name })),
    });
    return result;
  }

  private removeSensitiveInformation(orgs: IScratchOrg[]): IScratchOrg[] {
    this.debug('Removing sensitive information from org list');
    return orgs.map(
      (org: IScratchOrg) =>
        Object.fromEntries(Object.entries(org).filter(([key]) => key !== 'sfdxAuthUrl')) as IScratchOrg // not yet possible with TypeScript
    );
  }
}
