import { ConfigFile } from '@salesforce/core';
import { type IProject } from './api.js';

type HutteProjectConfig = {
  defaultProjectId: string;
  defaultProjectName: string;
  defaultProjectRepoFullName: string;
};

const CONFIG_KEYS: Array<keyof HutteProjectConfig> = [
  'defaultProjectId',
  'defaultProjectName',
  'defaultProjectRepoFullName',
];

class HutteProjectConfigFile extends ConfigFile<ConfigFile.Options, HutteProjectConfig> {}

async function getConfigFile(global: boolean): Promise<HutteProjectConfigFile> {
  return HutteProjectConfigFile.create({
    isGlobal: global,
    stateFolder: '.sf',
    filename: 'hutte-project.json',
  });
}

function readProject(configFile: HutteProjectConfigFile): IProject | undefined {
  const id = configFile.get('defaultProjectId');
  if (!id) return undefined;
  return {
    id,
    name: configFile.get('defaultProjectName'),
    repository: configFile.get('defaultProjectRepoFullName') ?? null,
    projectType: 'scratch_org',
  };
}

async function getDefaultProject(): Promise<IProject | undefined> {
  // Local config takes priority over global
  try {
    const local = await getConfigFile(false);
    const project = readProject(local);
    if (project) return project;
  } catch {
    // No local config available
  }

  try {
    const global = await getConfigFile(true);
    return readProject(global);
  } catch {
    return undefined;
  }
}

async function storeDefaultProject(project: IProject, global = false): Promise<void> {
  const configFile = await getConfigFile(global);
  configFile.set('defaultProjectId', project.id);
  configFile.set('defaultProjectName', project.name);
  if (project.repository) {
    configFile.set('defaultProjectRepoFullName', project.repository);
  }
  await configFile.write();
}

async function clearDefaultProject(global = false): Promise<void> {
  try {
    const configFile = await getConfigFile(global);
    configFile.unsetAll(CONFIG_KEYS);
    await configFile.write();
  } catch {
    // Ignore errors when clearing (e.g., not in a project directory)
  }
}

export default {
  getDefaultProject,
  storeDefaultProject,
  clearDefaultProject,
};
