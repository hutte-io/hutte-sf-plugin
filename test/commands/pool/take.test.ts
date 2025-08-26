import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { assert, expect } from 'chai';
import api, { IScratchOrg } from '../../../src/api.js';
import { Take } from '../../../src/commands/hutte/pool/take.js';
import common from '../../../src/common.js';
import config from '../../../src/config.js';
import { SfError } from '@salesforce/core';

describe('hutte:pool:take', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    testContext.SANDBOX.stub(config, 'getApiToken').resolves('t123');
    testContext.SANDBOX.stub(common, 'sfdxLogin').returns(mockParsedOrg);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('works as expected in happy path', async () => {
    testContext.SANDBOX.stub(api, 'takeOrgFromPool').resolves(mockParsedOrg);
    const result = await Take.run(['--name', 'mockOrg', '--timeout', '60', '--wait']);
    expect(result.projectId).to.equal('mockProjectId');
  });

  it('fails when taking an org from a pool fails', async () => {
    const error = new Error("This project doesn't have a pool defined. Setup a pool with at least one organization first.");
    testContext.SANDBOX.stub(api, 'takeOrgFromPool').rejects(error);
    try {
      await Take.run(['--name', 'mockOrg']);
    } catch (e) {
      assert(e instanceof SfError);
      if (e instanceof SfError) {
        expect(e.cause).to.equal(error);
      }
    }
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
