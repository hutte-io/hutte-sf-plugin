
interface ILoginResponse {
  userId: string;
  apiToken: string;
}

async function login(email: string, password: string): Promise<ILoginResponse> {
  try {
    const response = await fetch(_apiUrl('/api_tokens'), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('There is an error with authorization. Run `$ sf hutte auth login -h` for more information.');
    }

    const body = await response.json() as { data: { api_token: string; user_id: string } };
    return {
      apiToken: body.data.api_token,
      userId: body.data.user_id,
    };
  } catch (e) {
    if (typeof e === 'string' && /error with authorization/.test(e)) {
      throw new Error('Invalid credentials');
    }
    throw e;
  }
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

export interface IScratchOrgResponse {
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
}

const getScratchOrgs = async (
  apiToken: string,
  repoName: string,
  includeAll: boolean = false,
): Promise<IScratchOrg[]> => {
  const url = new URL(_apiUrl('/scratch_orgs'));
  url.searchParams.set('repo_name', repoName);
  url.searchParams.set('all', includeAll.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      Authorization: `Token token=${apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('There is an error with authorization. Run `$ sf hutte auth login -h` for more information.');
  }

  const body = await response.json() as { data: IScratchOrgResponse[] };
  return body.data.map((org) => ({
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
  }));
};

const takeOrgFromPool = async (
  apiToken: string,
  repoName: string,
  projectId?: string,
  orgName?: string,
): Promise<IScratchOrg> => {
  let org: IScratchOrgResponse;
  try {
    const url = new URL(_apiUrl('/take_from_pool'));
    url.searchParams.set('repo_name', repoName);
    if (orgName) url.searchParams.set('name', orgName);
    if (projectId) url.searchParams.set('project_id', projectId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        Authorization: `Token token=${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('There is an error with authorization. Run `$ sf hutte auth login -h` for more information.');
    }

    const body = await response.json() as { data: IScratchOrgResponse };
    org = body.data;
  } catch (e) {
    if (typeof e === 'string' && /no_pool/.test(e)) {
      throw new Error("This project doesn't have a pool defined. Setup a pool with at least one organization first.");
    }
    if (typeof e === 'string' && /no_active_org/.test(e)) {
      throw new Error('There is no active pool at the moment, try again later.');
    }
    throw e;
  }
  return {
    id: org.id,
    branchName: org.branch_name,
    createdAt: org.created_at,
    createdBy: org.created_by,
    commitSha: org.commit_sha,
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
};

const terminateOrg = async (
  apiToken: string,
  repoName: string,
  orgId: string,
  projectId?: string,
): Promise<void> => {
  const url = new URL(_apiUrl(`/scratch_orgs/${orgId}/terminate`));
  url.searchParams.set('repo_name', repoName);
  if (projectId) url.searchParams.set('project_id', projectId);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      Authorization: `Token token=${apiToken}`,
    },
  });

  if (response.status === 404) {
    throw new Error('Could not find the scratch org on hutte. Are you sure you are in the correct project or the default org is set?');
  }

  if (response.status === 401) {
    throw new Error('There is an error with authorization. Run `$ sf hutte auth login -h` for more information.');
  }

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error('Request to hutte failed ' + response.status + ' ' + responseBody);
  }
};



function _apiUrl(path: string): string {
  return `https://api.hutte.io/cli_api${path}`;
}

export default {
  login,
  getScratchOrgs,
  takeOrgFromPool,
  terminateOrg,
};

