import { Messages } from '@salesforce/core';
import { RequestError, type OptionsOfJSONResponseBody, type Response } from 'got';
import { getHttpClient } from './http-client.js';
import { type ResolvedProject } from './types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const sharedMessages = Messages.loadMessages('hutte', 'shared');

async function apiRequest<T>(
  method: 'get' | 'post',
  path: string,
  options?: OptionsOfJSONResponseBody
): Promise<Response<T>> {
  try {
    return await getHttpClient()(path, { method, ...options });
  } catch (error) {
    if (error instanceof RequestError) {
      throw sharedMessages.createError('error.networkError', undefined, undefined, error);
    }
    throw error;
  }
}

function authHeaders(apiToken: string): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Token token=${apiToken}`,
  };
}

function projectParams(project: ResolvedProject): Record<string, string> {
  /* eslint-disable camelcase */
  const params: Record<string, string> = {};
  if (project.repoName) params.repo_name = project.repoName;
  if (project.projectId) params.project_id = project.projectId;
  return params;
  /* eslint-enable camelcase */
}

type ILoginResponse = {
  userId: string;
  apiToken: string;
};

async function login(email: string, password: string): Promise<ILoginResponse> {
  const response = await apiRequest<{ data: { api_token: string; user_id: string } }>('post', 'api_tokens', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    json: { email, password },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.authorization');
  }

  return {
    apiToken: response.body.data.api_token,
    userId: response.body.data.user_id,
  };
}

export type IProject = {
  id: string;
  name: string;
  repository: string | null;
  projectType: string;
};

type IProjectResponse = {
  id: string;
  name: string;
  repo_full_name: string | null;
  project_type: string;
};

export type IScratchOrg = {
  id: string;
  branchName: string;
  commitSha: string;
  createdAt: string;
  createdBy: string;
  domain: string;
  globalId: string;
  initialBranchName: string;
  orgName: string;
  projectId: string;
  projectName: string;
  remainingDays: number;
  revisionNumber: string | null;
  salesforceId: string;
  sfdxAuthUrl?: string;
  slug: string;
  state: string;
  pool: boolean;
  webUrl?: string;
};

export type ICreateScratchOrgRequest = {
  project: ResolvedProject;
  name: string;
  initialBranchName?: string;
  durationDays?: number;
  branchName?: string;
  noAncestors?: boolean;
  noNamespace?: boolean;
  issueReference?: string;
  notes?: string;
  configJson?: Record<string, unknown>;
};

export type IScratchOrgResponse = {
  id: string;
  branch_name: string;
  commit_sha: string;
  created_at: string;
  created_by: string;
  domain: string;
  gid: string;
  initial_branch_name: string;
  name: string;
  project_id: string;
  project_name: string;
  remaining_days: string;
  revision_number: string | null;
  salesforce_id: string;
  sfdx_auth_url: string;
  slug: string;
  state: string;
  pool: boolean;
  web_url: string;
};

function mapScratchOrg(org: IScratchOrgResponse): IScratchOrg {
  return {
    id: org.id,
    branchName: org.branch_name,
    commitSha: org.commit_sha,
    createdAt: org.created_at,
    createdBy: org.created_by,
    domain: org.domain,
    globalId: org.gid,
    initialBranchName: org.initial_branch_name,
    orgName: org.name,
    projectId: org.project_id,
    projectName: org.project_name,
    remainingDays: +org.remaining_days,
    revisionNumber: org.revision_number,
    salesforceId: org.salesforce_id,
    sfdxAuthUrl: org.sfdx_auth_url,
    slug: org.slug,
    state: org.state,
    pool: org.pool,
    webUrl: org.web_url,
  };
}

async function getProjects(apiToken: string): Promise<IProject[]> {
  const response = await apiRequest<{ data: IProjectResponse[] }>('get', 'projects', {
    headers: authHeaders(apiToken),
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return response.body.data.map((p) => ({
    id: p.id,
    name: p.name,
    repository: p.repo_full_name,
    projectType: p.project_type,
  }));
}

async function getScratchOrgs(
  apiToken: string,
  project: ResolvedProject,
  includeAll: boolean = false
): Promise<IScratchOrg[]> {
  const response = await apiRequest<{ data: IScratchOrgResponse[] }>('get', 'scratch_orgs', {
    headers: authHeaders(apiToken),
    searchParams: {
      ...projectParams(project),
      all: includeAll.toString(),
    },
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return response.body.data.map(mapScratchOrg);
}

async function takeOrgFromPool(apiToken: string, project: ResolvedProject, orgName?: string): Promise<IScratchOrg> {
  const searchParams: Record<string, string> = { ...projectParams(project) };
  if (orgName) searchParams.name = orgName;

  const response = await apiRequest<{ data: IScratchOrgResponse; error?: string }>('post', 'take_from_pool', {
    headers: authHeaders(apiToken),
    searchParams,
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode === 400) {
    const body = response.body as { error: string };
    if (body.error === 'no_pool') {
      throw sharedMessages.createError('error.noPool');
    }
    throw sharedMessages.createError('error.serverError');
  }

  if (response.statusCode === 404) {
    const body = response.body as { error: string };
    if (body.error === 'no_active_org') {
      throw sharedMessages.createError('error.noActiveOrg');
    }
    throw sharedMessages.createError('error.serverError');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return mapScratchOrg(response.body.data);
}

async function terminateOrg(apiToken: string, project: ResolvedProject, orgId: string): Promise<void> {
  const response = await apiRequest('post', `scratch_orgs/${orgId}/terminate`, {
    headers: authHeaders(apiToken),
    searchParams: projectParams(project),
  });

  if (response.statusCode === 404) {
    throw sharedMessages.createError('error.orgNotFoundOnHutte');
  }

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }
}

export type IUser = {
  id: string;
  name: string;
  email: string;
  organizationName: string;
};

type IUserResponse = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
};

async function getMe(apiToken: string): Promise<IUser> {
  const response = await apiRequest<{ data: IUserResponse }>('get', 'me', {
    headers: authHeaders(apiToken),
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return {
    id: response.body.data.id,
    name: response.body.data.name,
    email: response.body.data.email,
    organizationName: response.body.data.organization_name,
  };
}

type ICreateScratchOrgRequestBody = {
  /* eslint-disable camelcase */
  repo_name?: string;
  name: string;
  project_id?: string;
  initial_branch_name?: string;
  duration_days?: number;
  branch_name?: string;
  no_ancestors?: boolean;
  no_namespace?: boolean;
  issue_reference?: string;
  notes?: string;
  config_json?: Record<string, unknown>;
  /* eslint-enable camelcase */
};

async function createScratchOrg(apiToken: string, request: ICreateScratchOrgRequest): Promise<IScratchOrg> {
  /* eslint-disable camelcase */
  const body: ICreateScratchOrgRequestBody = {
    name: request.name,
  };

  if (request.project.repoName) body.repo_name = request.project.repoName;
  if (request.project.projectId) body.project_id = request.project.projectId;
  if (request.initialBranchName) body.initial_branch_name = request.initialBranchName;
  if (request.durationDays) body.duration_days = request.durationDays;
  if (request.branchName) body.branch_name = request.branchName;
  if (request.noAncestors !== undefined) body.no_ancestors = request.noAncestors;
  if (request.noNamespace !== undefined) body.no_namespace = request.noNamespace;
  if (request.issueReference) body.issue_reference = request.issueReference;
  if (request.notes) body.notes = request.notes;
  if (request.configJson) body.config_json = request.configJson;
  /* eslint-enable camelcase */

  const response = await apiRequest<{ data: IScratchOrgResponse; error?: string }>('post', 'scratch_orgs', {
    headers: {
      ...authHeaders(apiToken),
      'Content-Type': 'application/json',
    },
    json: body,
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode === 400 || response.statusCode === 422) {
    const errorBody = response.body as { error?: string };
    throw sharedMessages.createError('error.badRequest', [errorBody.error ?? 'Bad request']);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return mapScratchOrg(response.body.data);
}

async function getScratchOrg(apiToken: string, project: ResolvedProject, orgId: string): Promise<IScratchOrg> {
  const response = await apiRequest<{ data: IScratchOrgResponse }>('get', `scratch_orgs/${orgId}`, {
    headers: authHeaders(apiToken),
    searchParams: projectParams(project),
  });

  if (response.statusCode === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.statusCode === 404) {
    throw sharedMessages.createError('error.orgNotFoundOnHutte');
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw sharedMessages.createError('error.serverError');
  }

  return mapScratchOrg(response.body.data);
}

export default {
  login,
  getMe,
  getProjects,
  getScratchOrgs,
  takeOrgFromPool,
  terminateOrg,
  createScratchOrg,
  getScratchOrg,
};
