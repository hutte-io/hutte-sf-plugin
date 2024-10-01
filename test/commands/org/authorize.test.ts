import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
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
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    testContext.SANDBOX.stub(config, 'getApiToken').resolves('t123');
    testContext.SANDBOX.stub(api, 'promiseRequest').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 200,
      },
      body: {
        data: [mockReceivedOrg],
      },
    });
    // @ts-expect-error private instance method
    testContext.SANDBOX.stub(Authorize.prototype, 'checkoutGitBranch').returns(mockParsedOrg);
    testContext.SANDBOX.stub(common, 'devHubSfdxLogin').returns();
    testContext.SANDBOX.stub(fs, 'writeFileSync').returns();
    testContext.SANDBOX.stub(fs, 'unlinkSync').returns();
    testContext.SANDBOX.stub(common, 'flagAsScratchOrg').returns(mockParsedOrg);
    // @ts-expect-error private instance method
    testContext.SANDBOX.stub(Authorize.prototype, 'sfdxPull').returns(mockParsedOrg);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorize happy path', async () => {
    testContext.SANDBOX.stub(cross_spawn, 'sync')
      .withArgs('sf')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0 })
      .withArgs('git')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });
    await Authorize.run([]);
    expect(true);
  });

  it('authorize fails on unstaged changes', async () => {
    testContext.SANDBOX.stub(cross_spawn, 'sync')
      .withArgs('sf')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0 })
      .withArgs('git')
      // @ts-expect-error not the full SpawnSyncReturns
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
    testContext.SANDBOX.stub(cross_spawn, 'sync')
      .withArgs('sf')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 1 })
      .withArgs('git')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0 });
    let err;
    try {
      await Authorize.run([]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/The login failed/);
  });

  it('authorize org by name', async () => {
    testContext.SANDBOX.stub(cross_spawn, 'sync')
      .withArgs('sf')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0 })
      .withArgs('git')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });

    await Authorize.run(['--org-name', 'Test Playground 1']);

    expect(true);
  });

  it('authorize fails when name does not exist', async () => {
    testContext.SANDBOX.stub(cross_spawn, 'sync')
      .withArgs('sf')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0 })
      .withArgs('git')
      // @ts-expect-error not the full SpawnSyncReturns
      .returns({ status: 0, stdout: 'https://github.com/mock-org/mock-repo.git\n' });

    let err;
    try {
      await Authorize.run(['--org-name', 'Non Existing']);
    } catch (e) {
      err = e;
    }

    expect(err).to.match(
      /There is not any scratch org to authorize by the provided name. \nRemove this flag to choose it from a list or access https:\/\/app.hutte.io to see the available orgs./,
    );
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
