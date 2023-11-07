import request from 'request';

interface ILoginResponse {
  userId: string;
  apiToken: string;
}

export async function login(email: string, password: string): Promise<ILoginResponse> {
  try {
    const { body } = await promiseRequest({
      body: { email, password },
      json: true,
      method: 'POST',
      uri: _apiUrl('/api_tokens'),
    });
    return {
      apiToken: body.data.api_token,
      userId: body.data.user_id,
    };
  } catch (e) {
    if (/error with authorization/.test(e)) {
      throw new Error('Invalid credentials');
    }
    throw e;
  }
}

type IScratchOrg = {
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
  name: string;
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
  const { body } = await promiseRequest({
    headers: {
      Authorization: `Token token=${apiToken}`,
    },
    json: true,
    method: 'GET',
    qs: {
      repo_name: repoName,
      all: includeAll,
    },
    uri: _apiUrl('/scratch_orgs'),
  });
  return body.data.map((org: IScratchOrgResponse) => ({
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
    name: org.name,
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
    const { body } = await promiseRequest({
      headers: {
        Authorization: `Token token=${apiToken}`,
      },
      json: true,
      method: 'POST',
      qs: { repo_name: repoName, name: orgName, project_id: projectId },
      uri: _apiUrl('/take_from_pool'),
    });
    org = body.data;
  } catch (e) {
    if (/no_pool/.test(e)) {
      throw new Error("This project doesn't have a pool defined. Setup a pool with at least one organization first.");
    }
    if (/no_active_org/.test(e)) {
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
    name: org.name,
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

export const terminateOrg = async (
  apiToken: string,
  repoName: string,
  orgId: string,
): Promise<{ response: request.Response; body: any }> => {
  return promiseRequest({
    headers: {
      Authorization: `Token token=${apiToken}`,
    },
    json: true,
    method: 'POST',
    qs: { repo_name: repoName },
    uri: _apiUrl(`/scratch_orgs/${orgId}/terminate`),
  });
};

export const promiseRequest = async (
  options: request.UriOptions & request.CoreOptions,
): Promise<{ response: request.Response; body: any }> =>
  new Promise<{ response: request.Response; body: any }>((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      if (body?.error) {
        reject(body.error);
        return;
      }
      if (Math.floor(response.statusCode / 100) !== 2) {
        reject('There is an error with authorization. Run `$ sf hutte auth login -h` for more information.');
        return;
      }
      resolve({ response, body });
    });
  });

function _apiUrl(path: string): string {
  return `https://api.hutte.io/cli_api${path}`;
}

export { IScratchOrg, getScratchOrgs, takeOrgFromPool };
