import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { stubMethod } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import cross_spawn from 'cross-spawn';
import fs from 'fs';
import * as api from '../../../src/api';
import { Authorize } from '../../../src/commands/hutte/org/authorize';
import * as common from '../../../src/common';
import * as config from '../../../src/config';

describe('hutte:org:authorize', async () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
    stubSfCommandUx($$.SANDBOX);
    stubMethod($$.SANDBOX, common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    stubMethod($$.SANDBOX, config, 'getApiToken').resolves('t123');
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
      body: {
        data: [mockReceivedOrg],
      },
    });
    stubMethod($$.SANDBOX, Authorize.prototype, 'checkoutGitBranch').returns();
    stubMethod($$.SANDBOX, common, 'devHubSfdxLogin').returns();
    stubMethod($$.SANDBOX, fs, 'writeFileSync').returns();
    stubMethod($$.SANDBOX, fs, 'unlinkSync').returns();
    stubMethod($$.SANDBOX, common, 'flagAsScratchOrg').returns(mockParsedOrg);
    stubMethod($$.SANDBOX, Authorize.prototype, 'sfdxPull').returns();
  });

  afterEach(() => {
    $$.restore();
  });

  it('authorize happy path', async () => {
    stubMethod($$.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 0 })
      .withArgs('git')
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });
    await Authorize.run([]);
    expect(true);
  });

  it('authorize fails on unstaged changes', async () => {
    stubMethod($$.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 0 })
      .withArgs('git')
      .returns({ status: 1 });
    let err;
    try {
      await Authorize.run([]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/You have unstaged changes/);
  });

  it('authorize fails on sfdx error', async () => {
    stubMethod($$.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 1 })
      .withArgs('git')
      .returns({ status: 0 });
    let err;
    try {
      await Authorize.run([]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/The sfdx login failed/);
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
