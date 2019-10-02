import * as request from 'request';
import { getCurrentUserInfo } from './config';
import { getUserApiToken } from './keychain';

interface LoginResponse {
  userId: string;
  apiToken: string;
}

function login(email: string, password: string): Promise<LoginResponse> {
  return new Promise<LoginResponse>((resolve, reject) => {
    request(
      {
        uri: _apiUrl('/api_tokens'),
        json: true,
        method: 'POST',
        body: { email, password },
      },
      (error, response, body) => {
        if (error) {
          return reject(error);
        }

        if (response.statusCode !== 201) {
          return reject('Invalid credentials');
        }

        resolve({
          userId: body.data.user_id,
          apiToken: body.data.api_token,
        });
      },
    );
  });
}

interface ScratchOrg {
  branchName: string;
  name: string;
  sfdxAuthUrl: string;
  slug: string;
}

function getScratchOrgs(repoName: string): Promise<ScratchOrg[]> {
  return getCurrentUserInfo()
    .then(userInfo => getUserApiToken(userInfo))
    .then(apiToken =>
      _promiseRequest({
        uri: _apiUrl('/scratch_orgs'),
        json: true,
        method: 'GET',
        qs: { repo_name: repoName },
        headers: {
          Authorization: `Token token=${apiToken}`,
        },
      }),
    )
    .then(({ body }) =>
      body.data.map(org => ({
        branchName: org.branch_name,
        name: org.name,
        sfdxAuthUrl: org.sfdx_auth_url,
        slug: org.slug,
      })),
    );
}

function _promiseRequest(
  options,
): Promise<{ response: request.Response; body }> {
  return new Promise<{ response: request.Response; body }>(
    (resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ response, body });
      });
    },
  );
}

function _apiUrl(path: string): string {
  return `https://app.hutte.io/cli_api${path}`;
}

export { getScratchOrgs, login, ScratchOrg };
