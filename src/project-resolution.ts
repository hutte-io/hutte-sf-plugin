import { Lifecycle } from '@salesforce/core';
import api from './api.js';
import common from './common.js';
import hutteProjectConfig from './hutte-project-config.js';
export type { ResolvedProject } from './types.js';
import { type ResolvedProject } from './types.js';

async function resolveProject(apiToken: string, flagProjectId?: string): Promise<ResolvedProject> {
  // 1. Explicit --project-id flag takes priority
  if (flagProjectId) {
    return {
      projectId: flagProjectId,
      source: 'flag',
    };
  }

  // 2. Stored default project — validate that the current user still has access
  const defaultProject = await hutteProjectConfig.getDefaultProject();
  if (defaultProject) {
    const projects = await api.getProjects(apiToken);
    const found = projects.find((p) => p.id === defaultProject.id);
    if (!found) {
      return handleStaleDefault(defaultProject.repository);
    }
    return {
      projectId: defaultProject.id,
      repoName: defaultProject.repository ?? undefined,
      source: 'default',
    };
  }

  // 3. Fall back to git-based resolution
  return {
    repoName: common.projectRepoFromOrigin(),
    source: 'git',
  };
}

async function handleStaleDefault(repoName?: string | null): Promise<ResolvedProject> {
  await Lifecycle.getInstance().emitWarning(
    'Default project no longer accessible. Clear it with `sf hutte project set --clear` or select a new one.'
  );
  return {
    repoName: repoName ?? common.projectRepoFromOrigin(),
    source: 'git',
  };
}

export default {
  resolveProject,
  handleStaleDefault,
};
