import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import chalk from 'chalk';
import Fuse from 'fuse.js';
import { search as searchPrompt } from '@inquirer/prompts';
import api, { ISandbox } from '../../../api.js';
import common from '../../../common.js';
import config from '../../../config.js';
import projectResolution from '../../../project-resolution.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.sandbox.authorize');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Authorize extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    'sandbox-name': Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.sandbox-name.summary'),
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
      env: 'HUTTE_PROJECT_ID',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Authorize);
    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const resolved = await projectResolution.resolveProject(apiToken, flags['project-id']);

    let sandboxName: string;
    let sfdxAuthUrl: string;

    if (flags['sandbox-name']) {
      sandboxName = flags['sandbox-name'];
      sfdxAuthUrl = await api.getSandboxAuthUrlByName(apiToken, resolved, sandboxName);
    } else {
      const sandboxes = await api.getSandboxes(apiToken, resolved);
      const sandbox = await this.chooseSandbox(sandboxes);
      sandboxName = sandbox.name;
      sfdxAuthUrl = await api.getSandboxAuthUrl(apiToken, sandbox.id);
    }

    this.spinner.start(messages.getMessage('spinner.authorizing', [sandboxName]));
    common.sandboxSfdxLogin(sandboxName, sfdxAuthUrl);
    this.spinner.stop();

    const alias = `hutte-${sandboxName}`;
    const username = resolveDefaultUsername();
    this.logSuccess(
      username
        ? messages.getMessage('success.authorizedAs', [sandboxName, username, alias])
        : messages.getMessage('success.authorized', [sandboxName, alias])
    );
  }

  private async chooseSandbox(sandboxes: ISandbox[]): Promise<ISandbox> {
    this.debug(`Choosing from ${sandboxes.length} sandboxes`);
    if (sandboxes.length === 0) {
      throw messages.createError('error.noSandboxesToAuthorize');
    }
    if (sandboxes.length === 1) {
      this.info(messages.getMessage('info.autoSelected', [sandboxes[0].name]));
      return sandboxes[0];
    }

    const answer = await searchPrompt({
      message: messages.getMessage('prompt.chooseSandbox'),
      source: (term) => {
        let filtered = sandboxes;
        if (term) {
          const fuse = new Fuse(sandboxes, { keys: ['name', 'displayName'], threshold: 0.3 });
          filtered = fuse.search(term).map((result) => result.item);
        }
        return filtered.map((sandbox) => ({
          value: sandbox.id,
          name: `${sandbox.name} ${chalk.gray(`- ${sandbox.projectName}`)}`,
        }));
      },
    });
    const selected = sandboxes.find((sandbox) => sandbox.id === answer);
    if (!selected) {
      throw messages.createError('error.noSandboxSelected');
    }
    return selected;
  }
}

function resolveDefaultUsername(): string | undefined {
  try {
    return common.getDefaultOrgInfo().username;
  } catch {
    // Best-effort: a display hiccup must not turn a successful login into a failure.
    return undefined;
  }
}
