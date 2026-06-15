import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { ISandbox } from '../../../api.js';
import config from '../../../config.js';
import projectResolution from '../../../project-resolution.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.sandbox.list');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class List extends SfCommand<ISandbox[]> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
      env: 'HUTTE_PROJECT_ID',
    }),
  };

  public async run(): Promise<ISandbox[]> {
    const { flags } = await this.parse(List);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);
    const result = await api.getSandboxes(apiToken, resolved);

    const rows = result.map((sandbox) => ({
      name: sandbox.name,
      displayName: sandbox.displayName ?? '',
      projectName: sandbox.projectName,
      licenseType: sandbox.licenseType ?? '',
      status: sandbox.salesforceStatus,
      lastRefreshedAt: sandbox.lastRefreshedAt ?? '',
      createSandboxFrom: sandbox.createSandboxFrom ?? '',
      salesforceUser: sandbox.salesforceUser?.name ?? '',
      pool: sandbox.pool ? 'yes' : 'no',
    }));

    this.table({
      data: rows,
      columns: [
        { key: 'name', name: 'Name' },
        { key: 'displayName', name: 'Display Name' },
        { key: 'projectName', name: 'Project' },
        { key: 'licenseType', name: 'License' },
        { key: 'status', name: 'Status' },
        { key: 'lastRefreshedAt', name: 'Last Refreshed' },
        { key: 'createSandboxFrom', name: 'Created From' },
        { key: 'salesforceUser', name: 'Salesforce User' },
        { key: 'pool', name: 'Pool' },
      ],
    });

    return result;
  }
}
