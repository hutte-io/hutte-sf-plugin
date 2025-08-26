import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect, assert } from 'chai';
import api, { IScratchOrg } from '../../../src/api.js';
import { Authorize } from '../../../src/commands/hutte/org/authorize.js';
import common from '../../../src/common.js';
import config from '../../../src/config.js';
import { SfError } from '@salesforce/core';

describe('hutte:org:authorize', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  var stubs: Record<string, sinon.SinonStub> = {};

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    testContext.SANDBOX.stub(config, 'getApiToken').resolves('t123');
    testContext.SANDBOX.stub(api, 'getScratchOrgs')
      .withArgs('t123', 'https://github.com/mock-org/mock-repo.git')
      .resolves([mockParsedOrg]);
    stubs = {
      // @ts-expect-error private instance method
      checkoutGitBranch: testContext.SANDBOX.stub(Authorize.prototype, 'checkoutGitBranch').returns(mockParsedOrg),
      // @ts-expect-error private instance method
      sfdxPull: testContext.SANDBOX.stub(Authorize.prototype, 'sfdxPull').returns(mockParsedOrg),
      // @ts-expect-error private instance method
      checkUnstagedChanges: testContext.SANDBOX.stub(Authorize.prototype, 'checkUnstagedChanges').returns(),
      sfdxLogin: testContext.SANDBOX.stub(common, 'sfdxLogin').returns(mockParsedOrg),
    }
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorize happy path', async () => {
    await Authorize.run([]);
    assert(true)
  });

  it('authorize fails on unstaged changes', async () => {
    const error = new Error('You have unstaged changes. Please commit or stash them before proceeding.');
    stubs.checkUnstagedChanges.throws(error);

    try {
      await Authorize.run([]);
      assert(false, 'should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      if (e instanceof SfError) {
        expect(e.cause).to.equal(error);
      }
    }
  });

  it('authorize fails on sfdx error', async () => {
    const error = new Error('The login failed.');
    stubs.sfdxLogin.throws(error);

    try {
      await Authorize.run([]);
      assert(false, 'should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      if (e instanceof SfError) {
        expect(e.cause).to.equal(error);
      }
    }
  });

  it('authorize org by name', async () => {
    await Authorize.run(['--org-name', 'Test Playground 1']);

    expect(true);
  });

  it('authorize fails when name does not exist', async () => {
    try {
      await Authorize.run(['--org-name', 'Non Existing']);
      assert(false, 'should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      if (e instanceof SfError) {
        expect(e.cause).to.match(
          /There is not any scratch org to authorize by the provided name. \nRemove this flag to choose it from a list or access https:\/\/app.hutte.io to see the available orgs./,
        );
      }
    }
  });

  it('skips git ops when --no-git is provided', async () => {
    await Authorize.run(['--no-git']);

    assert(stubs.checkUnstagedChanges.notCalled, 'checkUnstagedChanges should not be called');
    assert(stubs.checkoutGitBranch.notCalled, 'checkoutGitBranch should not be called');
  });
});

const mockParsedOrg: IScratchOrg = {
  id: 'mockId',
  branchName: 'mockBranch1',
  commitSha: '1234567890',
  devhubId: '00D7Q000005YnXXXXX',
  devhubSfdxAuthUrl: 'force://mockDevHubUrl',
  orgName: 'Test Playground 1',
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
