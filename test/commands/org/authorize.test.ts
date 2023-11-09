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
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubMethod(testContext.SANDBOX, common, 'projectRepoFromOrigin').returns(
      'https://github.com/mock-org/mock-repo.git',
    );
    stubMethod(testContext.SANDBOX, config, 'getApiToken').resolves('t123');
    stubMethod(testContext.SANDBOX, api, 'promiseRequest').resolves({
      body: {
        data: [mockReceivedOrg],
      },
    });
    stubMethod(testContext.SANDBOX, Authorize.prototype, 'checkoutGitBranch').returns();
    stubMethod(testContext.SANDBOX, common, 'devHubSfdxLogin').returns();
    stubMethod(testContext.SANDBOX, fs, 'writeFileSync').returns();
    stubMethod(testContext.SANDBOX, fs, 'unlinkSync').returns();
    stubMethod(testContext.SANDBOX, common, 'flagAsScratchOrg').returns(mockParsedOrg);
    stubMethod(testContext.SANDBOX, Authorize.prototype, 'sfdxPull').returns();
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorize happy path', async () => {
    stubMethod(testContext.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 0 })
      .withArgs('git')
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });
    await Authorize.run([]);
    expect(true);
  });

  it('authorize fails on unstaged changes', async () => {
    stubMethod(testContext.SANDBOX, cross_spawn, 'sync')
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
    stubMethod(testContext.SANDBOX, cross_spawn, 'sync')
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

  it('authorize org by name', async () => {
    stubMethod(testContext.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 0 })
      .withArgs('git')
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });

    await Authorize.run(['--org-name', 'Test Playground 1']);

    expect(true);
  });

  it('authorize fails when name does not exist', async () => {
    stubMethod(testContext.SANDBOX, cross_spawn, 'sync')
      .withArgs('sfdx')
      .returns({ status: 0 })
      .withArgs('git')
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });
      
      let err;
      try {
        await Authorize.run(['--org-name', 'Non Existing']);
      } catch(e) {
        err = e;
      }

      expect(err).to.match(/There is not any scratch org to authorize by the provided name. \nRemove this flag to choose it from a list or access https:\/\/app.hutte.io to see the available orgs./);
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
