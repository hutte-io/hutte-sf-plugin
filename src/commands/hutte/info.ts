import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { type IUser } from '../../api.js';
import config from '../../config.js';
import hutteProjectConfig from '../../hutte-project-config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.info');

type InfoResult = {
  user: { id: string; name: string; email: string; organizationName: string } | null;
  defaultProject: { id: string; name: string; repository: string | null } | null;
};

export class Info extends SfCommand<InfoResult> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: messages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
  };

  public async run(): Promise<InfoResult> {
    const { flags } = await this.parse(Info);

    let user: IUser | null = null;
    try {
      const apiToken = flags['api-token'] ?? (await config.getApiToken());
      user = await api.getMe(apiToken);
    } catch {
      // Not logged in or token invalid
    }

    this.styledHeader('Account');
    if (user) {
      this.styledObject({
        Name: user.name,
        Email: user.email,
        Organization: user.organizationName,
      });
    } else {
      this.log(messages.getMessage('info.notLoggedIn'));
    }

    const defaultProject = await hutteProjectConfig.getDefaultProject();

    this.styledHeader('Default Project');
    if (defaultProject) {
      this.styledObject({
        Name: defaultProject.name,
        Repository: defaultProject.repository,
      });
    } else {
      this.log(messages.getMessage('info.noDefaultProject'));
    }

    return {
      user: user ? { id: user.id, name: user.name, email: user.email, organizationName: user.organizationName } : null,
      defaultProject: defaultProject
        ? { id: defaultProject.id, name: defaultProject.name, repository: defaultProject.repository }
        : null,
    };
  }
}
