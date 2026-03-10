import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import chalk from 'chalk';
import Fuse from 'fuse.js';
import { search as searchPrompt } from '@inquirer/prompts';
import api, { type IProject } from '../../../api.js';
import config from '../../../config.js';
import hutteProjectConfig from '../../../hutte-project-config.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.project.set');
const sharedMessages = Messages.loadMessages('hutte', 'shared');

const CANCEL_VALUE = '__cancel__';

export class ProjectSet extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-token': Flags.string({
      char: 't',
      summary: sharedMessages.getMessage('flags.api-token.summary'),
      env: 'HUTTE_API_TOKEN',
    }),
    'project-id': Flags.string({
      char: 'p',
      summary: sharedMessages.getMessage('flags.project-id.summary'),
    }),
    clear: Flags.boolean({
      summary: messages.getMessage('flags.clear.summary'),
      default: false,
    }),
    global: Flags.boolean({
      char: 'g',
      summary: messages.getMessage('flags.global.summary'),
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ProjectSet);
    const global = flags.global;

    if (flags.clear) {
      await hutteProjectConfig.clearDefaultProject(global);
      this.info(messages.getMessage(global ? 'info.globalDefaultProjectCleared' : 'info.defaultProjectCleared'));
      return;
    }

    const apiToken = flags['api-token'] ?? (await config.getApiToken());
    const allProjects = await api.getProjects(apiToken);
    const projects = allProjects.filter((p) => p.projectType === 'scratch_org');

    if (projects.length === 0) {
      throw messages.createError('error.noProjects');
    }

    let selectedProject: IProject;

    if (flags['project-id']) {
      const found = projects.find((p) => p.id === flags['project-id']);
      if (!found) {
        throw messages.createError('error.noProjects');
      }
      selectedProject = found;
    } else {
      const result = await chooseProject(projects);
      if (!result) {
        this.info(messages.getMessage('info.cancelled'));
        return;
      }
      selectedProject = result;
    }

    await hutteProjectConfig.storeDefaultProject(selectedProject, global);
    this.info(
      messages.getMessage(global ? 'info.globalDefaultProjectSet' : 'info.defaultProjectSet', [selectedProject.name])
    );
  }
}

async function chooseProject(projects: IProject[]): Promise<IProject | undefined> {
  const defaultProject = await hutteProjectConfig.getDefaultProject();

  const answer = await searchPrompt({
    message: messages.getMessage('prompt.chooseProject'),
    source: (term) => {
      let filtered = projects;
      if (term) {
        const fuse = new Fuse(projects, { keys: ['name', 'repository'], threshold: 0.3 });
        filtered = fuse.search(term).map((result) => result.item);
      }
      const choices = filtered.map((project) => {
        const isDefault = defaultProject?.id === project.id;
        const suffix = isDefault ? chalk.green(' (default)') : '';
        return {
          value: project.id,
          name: `${project.name}${project.repository ? ` (${project.repository})` : ''}${suffix}`,
        };
      });
      choices.push({ value: CANCEL_VALUE, name: chalk.gray('Cancel') });
      return choices;
    },
  });

  if (answer === CANCEL_VALUE) {
    return undefined;
  }

  const selected = projects.find((p) => p.id === answer);
  if (!selected) {
    throw messages.createError('error.noProjectSelected');
  }
  return selected;
}
