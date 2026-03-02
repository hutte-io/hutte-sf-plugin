import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { IProject } from '../../../api.js';
import config from '../../../config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.project.list');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class List extends SfCommand<IProject[]> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
    }),
  };

  public async run(): Promise<IProject[]> {
    const { flags } = await this.parse(List);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const allProjects = await api.getProjects(apiToken);
    const result = allProjects.filter((p) => p.projectType === 'scratch_org');
    this.table({
      data: result,
      columns: ['id', 'name', 'repository'],
      headerOptions: {
        formatter: 'capitalCase',
      },
    });
    return result;
  }
}
