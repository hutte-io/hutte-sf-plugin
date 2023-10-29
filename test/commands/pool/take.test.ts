import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { stubMethod } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as api from '../../../src/api';
import { Take } from '../../../src/commands/hutte/pool/take';
import * as common from '../../../src/common';
import * as config from '../../../src/config';

describe('hutte:pool:take', async () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
    stubSfCommandUx($$.SANDBOX);
    stubMethod($$.SANDBOX, common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    stubMethod($$.SANDBOX, config, 'getApiToken').resolves('t123');
    stubMethod($$.SANDBOX, common, 'devHubSfdxLogin').returns();
    stubMethod($$.SANDBOX, common, 'sfdxLogin').returns(mockParsedOrg);
    stubMethod($$.SANDBOX, common, 'flagAsScratchOrg').returns(mockParsedOrg);
  });

  afterEach(() => {
    $$.restore();
  });

  it('works as expected in happy path', async () => {
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
      response: {
        statusCode: 200,
      },
      body: {
        data: mockReceivedOrg,
      },
    });
    const result = await Take.run(['--name', 'mockOrg', '--timeout', '60', '--wait']);
    expect(result.projectId).to.equal('mockProjectId');
  });

  it('fails when there is not a pool in the project', async () => {
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
      response: {
        statusCode: 500,
      },
      body: {
        error: 'no_pool',
      },
    });
    let err;
    try {
      await Take.run(['--name', 'mockOrg']);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/This project doesn't have a pool defined/);
  });

  it('fails when there is not an active org at the pool', async () => {
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
      response: {
        statusCode: 500,
      },
      body: {
        error: 'no_active_org',
      },
    });
    let err;
    try {
      await Take.run(['--name', 'mockOrg']);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/There is no active pool at the moment/);
  });
});

const mockReceivedOrg: api.IScratchOrgResponse = {
  id: 'mockId',
  branch_name: 'mockBranch1',
  commit_sha: '1234567890',
  devhub_id: '00D7Q000005YnXXXXX',
  devhub_sfdx_auth_url: 'force://mockDevHubUrl',
  name: 'Test Playground 1',
  project_name: 'Test Playground 1',
  sfdx_auth_url: 'force://mockUrl1',
  revision_number: '0',
  slug: 'mock',
  state: 'active',
  salesforce_id: 'mockId',
  remaining_days: '1',
  project_id: 'mockProjectId',
  initial_branch_name: 'master',
  gid: 'mockGlobalId',
  domain: 'CS162',
  created_at: '2023-05-31T10:11:57.135Z',
  created_by: 'Test User',
  pool: false,
};

const mockParsedOrg: api.IScratchOrg = {
  id: 'mockId',
  branchName: 'mockBranch1',
  commitSha: '1234567890',
  devhubId: '00D7Q000005YnXXXXX',
  devhubSfdxAuthUrl: 'force://mockDevHubUrl',
  name: 'Test Playground 1',
  projectName: 'Test Playground 1',
  sfdxAuthUrl: 'force://mockUrl1',
  revisionNumber: '0',
  slug: 'mock',
  state: 'active',
  salesforceId: 'mockId',
  remainingDays: 1,
  projectId: 'mockProjectId',
  initialBranchName: 'master',
  globalId: 'mockGlobalId',
  domain: 'CS162',
  createdAt: '2023-05-31T10:11:57.135Z',
  createdBy: 'Test User',
  pool: false,
};
