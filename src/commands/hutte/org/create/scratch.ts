import { existsSync, readFileSync } from 'node:fs';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import api, { ICreateScratchOrgRequest, IScratchOrg } from '../../../../api.js';
import common from '../../../../common.js';
import config from '../../../../config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.org.create.scratch');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

export class Scratch extends SfCommand<IScratchOrg> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly requiresProject = true;

  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      required: true,
      summary: messages.getMessage('flags.name.summary'),
    }),
    async: Flags.boolean({
      summary: messages.getMessage('flags.async.summary'),
      default: false,
    }),
    wait: Flags.integer({
      char: 'w',
      summary: messages.getMessage('flags.wait.summary'),
      default: 10,
    }),
    'initial-branch': Flags.string({
      char: 'b',
      summary: messages.getMessage('flags.initial-branch.summary'),
    }),
    branch: Flags.string({
      summary: messages.getMessage('flags.branch.summary'),
    }),
    'duration-days': Flags.integer({
      char: 'y',
      summary: messages.getMessage('flags.duration-days.summary'),
      default: 7,
      min: 1,
      max: 30,
    }),
    'no-ancestors': Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.no-ancestors.summary'),
      default: false,
    }),
    'no-namespace': Flags.boolean({
      char: 'm',
      summary: messages.getMessage('flags.no-namespace.summary'),
      default: false,
    }),
    issue: Flags.string({
      summary: messages.getMessage('flags.issue.summary'),
    }),
    notes: Flags.string({
      summary: messages.getMessage('flags.notes.summary'),
    }),
    'definition-file': Flags.file({
      char: 'f',
      summary: messages.getMessage('flags.definition-file.summary'),
      exists: true,
    }),
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
    }),
  };

  private static readDefinitionFile(filePath: string): Record<string, unknown> {
    if (!existsSync(filePath)) {
      throw messages.createError('error.definitionFileNotFound', [filePath]);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw messages.createError('error.invalidDefinitionFile', [filePath]);
    }
  }

  private static handleTerminalState(org: IScratchOrg): void {
    switch (org.state) {
      case 'failed':
        throw messages.createError('error.orgCreationFailed');
      case 'setup_failed':
        throw messages.createError('error.setupFailed');
      case 'push_failed':
        throw messages.createError('error.pushFailed');
      default:
        break;
    }
  }

  public async run(): Promise<IScratchOrg> {
    const { flags } = await this.parse(Scratch);
    const repoName = common.projectRepoFromOrigin();
    const apiToken = flags['api-token'] ?? (await config.getApiToken());

    const initialBranchName = flags['initial-branch'] ?? common.getCurrentBranch();

    const request: ICreateScratchOrgRequest = {
      repoName,
      name: flags.name,
      projectId: flags['project-id'],
      initialBranchName,
      branchName: flags.branch,
      durationDays: flags['duration-days'],
      noAncestors: flags['no-ancestors'] || undefined,
      noNamespace: flags['no-namespace'] || undefined,
      issueReference: flags.issue,
      notes: flags.notes,
    };

    if (flags['definition-file']) {
      request.configJson = Scratch.readDefinitionFile(flags['definition-file']);
    }

    this.spinner.start(messages.getMessage('spinner.creating'));
    const scratchOrg = await api.createScratchOrg(apiToken, request);
    this.spinner.stop();

    this.info(messages.getMessage('info.orgCreated', [scratchOrg.orgName, scratchOrg.id]));

    if (flags.async) {
      this.displayOrgInfo(scratchOrg);
      return scratchOrg;
    }

    const timeoutMs = flags.wait * 60 * 1000;
    const intervalMs = 5000;

    this.spinner.start(messages.getMessage('spinner.waiting'));

    const finalOrg = await common.pollForOrgStatus(() => api.getScratchOrg(apiToken, repoName, scratchOrg.id), {
      timeoutMs,
      intervalMs,
      onStatusChange: (status) => {
        this.spinner.status = messages.getMessage('info.status', [status]);
      },
    });

    this.spinner.stop();

    Scratch.handleTerminalState(finalOrg);

    this.info(messages.getMessage('info.orgReady', [finalOrg.orgName]));

    this.spinner.start(messages.getMessage('spinner.authenticating'));
    common.sfdxLogin(finalOrg);
    this.spinner.stop();

    this.displayOrgInfo(finalOrg);
    return finalOrg;
  }

  private displayOrgInfo(org: IScratchOrg): void {
    this.table({
      data: [org],
      columns: [
        { key: 'id', name: 'Scratch Org Id' },
        { key: 'orgName', name: 'Org Name' },
        { key: 'state', name: 'State' },
        { key: 'branchName', name: 'Branch Name' },
        { key: 'remainingDays', name: 'Remaining Days' },
      ],
    });
  }
}
