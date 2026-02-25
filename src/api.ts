import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const sharedMessages = Messages.loadMessages('hutte', 'shared');

function apiUrl(path: string): string {
  // return `https://api.hutte.io/cli_api${path}`;
  return `https://vini-hutte.eu.ngrok.io/cli_api${path}`;
}

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw sharedMessages.createError('error.networkError', undefined, undefined, error as Error);
  }
}

function authHeaders(apiToken: string): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Token token=${apiToken}`,
  };
}

type ILoginResponse = {
  userId: string;
  apiToken: string;
};

async function login(email: string, password: string): Promise<ILoginResponse> {
  const response = await apiFetch(apiUrl('/api_tokens'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw sharedMessages.createError('error.authorization');
  }

  const body = (await response.json()) as { data: { api_token: string; user_id: string } };
  return {
    apiToken: body.data.api_token,
    userId: body.data.user_id,
  };
}

export type IScratchOrg = {
  id: string;
  branchName: string;
  commitSha: string;
  createdAt: string;
  createdBy: string;
  devhubId: string;
  devhubSfdxAuthUrl?: string;
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
};

export type ICreateScratchOrgRequest = {
  repoName: string;
  name: string;
  projectId?: string;
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
  devhub_id: string;
  devhub_sfdx_auth_url: string;
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
};

function mapScratchOrg(org: IScratchOrgResponse): IScratchOrg {
  return {
    id: org.id,
    branchName: org.branch_name,
    commitSha: org.commit_sha,
    createdAt: org.created_at,
    createdBy: org.created_by,
    devhubId: org.devhub_id,
    devhubSfdxAuthUrl: org.devhub_sfdx_auth_url,
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
  };
}

async function getScratchOrgs(apiToken: string, repoName: string, includeAll: boolean = false): Promise<IScratchOrg[]> {
  const url = new URL(apiUrl('/scratch_orgs'));
  url.searchParams.set('repo_name', repoName);
  url.searchParams.set('all', includeAll.toString());

  const response = await apiFetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(apiToken),
  });

  if (response.status === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (!response.ok) {
    throw sharedMessages.createError('error.serverError');
  }

  const body = (await response.json()) as { data: IScratchOrgResponse[] };
  return body.data.map(mapScratchOrg);
}

async function takeOrgFromPool(
  apiToken: string,
  repoName: string,
  projectId?: string,
  orgName?: string
): Promise<IScratchOrg> {
  const url = new URL(apiUrl('/take_from_pool'));
  url.searchParams.set('repo_name', repoName);
  if (orgName) url.searchParams.set('name', orgName);
  if (projectId) url.searchParams.set('project_id', projectId);

  const response = await apiFetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(apiToken),
  });

  if (response.status === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.status === 400) {
    const body = (await response.json()) as { error: string };
    if (body.error === 'no_pool') {
      throw sharedMessages.createError('error.noPool');
    }
    throw sharedMessages.createError('error.serverError');
  }

  if (response.status === 404) {
    const body = (await response.json()) as { error: string };
    if (body.error === 'no_active_org') {
      throw sharedMessages.createError('error.noActiveOrg');
    }
    throw sharedMessages.createError('error.serverError');
  }

  if (!response.ok) {
    throw sharedMessages.createError('error.serverError');
  }

  const body = (await response.json()) as { data: IScratchOrgResponse };
  return mapScratchOrg(body.data);
}

async function terminateOrg(apiToken: string, repoName: string, orgId: string, projectId?: string): Promise<void> {
  const url = new URL(apiUrl(`/scratch_orgs/${orgId}/terminate`));
  url.searchParams.set('repo_name', repoName);
  if (projectId) url.searchParams.set('project_id', projectId);

  const response = await apiFetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(apiToken),
  });

  if (response.status === 404) {
    throw sharedMessages.createError('error.orgNotFoundOnHutte');
  }

  if (response.status === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (!response.ok) {
    throw sharedMessages.createError('error.serverError');
  }
}

type ICreateScratchOrgRequestBody = {
  /* eslint-disable camelcase */
  repo_name: string;
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
  const url = new URL(apiUrl('/scratch_orgs'));

  /* eslint-disable camelcase */
  const body: ICreateScratchOrgRequestBody = {
    repo_name: request.repoName,
    name: request.name,
  };

  if (request.projectId) body.project_id = request.projectId;
  if (request.initialBranchName) body.initial_branch_name = request.initialBranchName;
  if (request.durationDays) body.duration_days = request.durationDays;
  if (request.branchName) body.branch_name = request.branchName;
  if (request.noAncestors !== undefined) body.no_ancestors = request.noAncestors;
  if (request.noNamespace !== undefined) body.no_namespace = request.noNamespace;
  if (request.issueReference) body.issue_reference = request.issueReference;
  if (request.notes) body.notes = request.notes;
  if (request.configJson) body.config_json = request.configJson;
  /* eslint-enable camelcase */

  const response = await apiFetch(url.toString(), {
    method: 'POST',
    headers: {
      ...authHeaders(apiToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.status === 400 || response.status === 422) {
    const errorBody = (await response.json()) as { error?: string };
    throw sharedMessages.createError('error.badRequest', [errorBody.error ?? 'Bad request']);
  }

  if (!response.ok) {
    throw sharedMessages.createError('error.serverError');
  }

  const responseBody = (await response.json()) as { data: IScratchOrgResponse };
  return mapScratchOrg(responseBody.data);
}

async function getScratchOrg(apiToken: string, repoName: string, orgId: string): Promise<IScratchOrg> {
  const url = new URL(apiUrl(`/scratch_orgs/${orgId}`));
  url.searchParams.set('repo_name', repoName);

  const response = await apiFetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(apiToken),
  });

  if (response.status === 401) {
    throw sharedMessages.createError('error.authorization');
  }

  if (response.status === 404) {
    throw sharedMessages.createError('error.orgNotFoundOnHutte');
  }

  if (!response.ok) {
    throw sharedMessages.createError('error.serverError');
  }

  const responseBody = (await response.json()) as { data: IScratchOrgResponse };
  return mapScratchOrg(responseBody.data);
}

export default {
  login,
  getScratchOrgs,
  takeOrgFromPool,
  terminateOrg,
  createScratchOrg,
  getScratchOrg,
};
