import request from 'request';
import { getCurrentUserInfo } from './config';
import { getUserApiToken } from './keychain';

interface ILoginResponse {
  userId: string;
  apiToken: string;
}

const login = async (
  email: string,
  password: string,
): Promise<ILoginResponse> =>
  new Promise<ILoginResponse>((resolve, reject) => {
    request(
      {
        body: { email, password },
        json: true,
        method: 'POST',
        uri: _apiUrl('/api_tokens'),
      },
      (error, response, body) => {
        if (error) {
          return reject(error);
        }

        if (response.statusCode !== 201) {
          return reject('Invalid credentials');
        }

        resolve({
          apiToken: body.data.api_token,
          userId: body.data.user_id,
        });
      },
    );
  });

interface IScratchOrg {
  id: string;
  branchName: string;
  commitSha: string;
  devhubId: string;
  devhubSfdxAuthUrl: string;
  name: string;
  projectName: string;
  sfdxAuthUrl: string;
  slug: string;
}

interface IScratchOrgResponse {
  id: string;
  branch_name: string;
  commit_sha: string;
  devhub_id: string;
  devhub_sfdx_auth_url: string;
  name: string;
  project_name: string;
  sfdx_auth_url: string;
  slug: string;
}

const getScratchOrgs = async (repoName: string): Promise<IScratchOrg[]> =>
  getCurrentUserInfo()
    .then((userInfo) => getUserApiToken(userInfo))
    .then((apiToken) =>
      promiseRequest({
        headers: {
          Authorization: `Token token=${apiToken}`,
        },
        json: true,
        method: 'GET',
        qs: { repo_name: repoName },
        uri: _apiUrl('/scratch_orgs'),
      }),
    )
    .then(({ body }) =>
      body.data.map((org: IScratchOrgResponse) => ({
        id: org.id,
        branchName: org.branch_name,
        devhubId: org.devhub_id,
        devhubSfdxAuthUrl: org.devhub_sfdx_auth_url,
        name: org.name,
        projectName: org.project_name,
        sfdxAuthUrl: org.sfdx_auth_url,
        slug: org.slug,
      })),
    );

const takeOrgFromPool = async (
  apiToken: string,
  repoName: string,
  projectId: string,
  orgName: string,
): Promise<IScratchOrg> => {
  apiToken =
    apiToken ||
    (await getCurrentUserInfo().then((userInfo) => getUserApiToken(userInfo)));

  return promiseRequest({
    headers: {
      Authorization: `Token token=${apiToken}`,
    },
    json: true,
    method: 'POST',
    qs: { repo_name: repoName, name: orgName, project_id: projectId },
    uri: _apiUrl('/take_from_pool'),
  }).then(({ response, body }) => {
    if (Math.floor(response.statusCode / 100) !== 2) {
      return Promise.reject({ response, body });
    }

    const org: IScratchOrgResponse = body.data;

    return {
      id: org.id,
      branchName: org.branch_name,
      commitSha: org.commit_sha,
      devhubId: org.devhub_id,
      devhubSfdxAuthUrl: org.devhub_sfdx_auth_url,
      name: org.name,
      projectName: org.project_name,
      sfdxAuthUrl: org.sfdx_auth_url,
      slug: org.slug,
    };
  });
};

export const terminateOrg = async (
  apiToken: string,
  repoName: string,
  orgId: string,
): Promise<{ response: request.Response; body }> => {
  apiToken =
    apiToken ||
    (await getCurrentUserInfo().then((userInfo) => getUserApiToken(userInfo)));

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

const promiseRequest = async (
  options: request.UriOptions & request.CoreOptions,
): Promise<{ response: request.Response; body }> =>
  new Promise<{ response: request.Response; body }>((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject({ response, body, error });
        return;
      }

      resolve({ response, body });
    });
  });

function _apiUrl(path: string): string {
  return `https://app.hutte.io/cli_api${path}`;
}

export { getScratchOrgs, takeOrgFromPool, login, IScratchOrg };
