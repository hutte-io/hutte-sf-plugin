import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { stubMethod } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as api from '../../../src/api';
import { List } from '../../../src/commands/hutte/org/list';
import * as common from '../../../src/common';
import * as config from '../../../src/config';

describe('hutte:org:list', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubMethod(testContext.SANDBOX, common, 'projectRepoFromOrigin').returns();
    stubMethod(testContext.SANDBOX, config, 'getApiToken').resolves('t123');
    stubMethod(testContext.SANDBOX, api, 'getScratchOrgs').resolves(scratchOrgResult);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('happy path, returns all details', async () => {
    const result = await List.run(['--verbose']);
    expect(result.length).to.be.eql(3);
    expect(result[0].name).to.be.eql('Test Playground 1');
    expect(result[0].projectName).to.be.eql('Test Playground 1');
    expect(result[0].state).to.be.eql('active');
    expect(result[0].devhubSfdxAuthUrl).to.be.eql('force://mockDevHubUrl');
    expect(result[0].sfdxAuthUrl).to.be.eql('force://mockUrl1');
  });

  it('happy path, returns basic details', async () => {
    const result = await List.run([]);
    expect(result.length).to.be.eql(3);
    expect(result[0].name).to.be.eql('Test Playground 1');
    expect(result[0].projectName).to.be.eql('Test Playground 1');
    expect(result[0].state).to.be.eql('active');
    expect(result[0].devhubSfdxAuthUrl).to.be.undefined;
    expect(result[0].sfdxAuthUrl).to.be.undefined;
  });
});

const scratchOrgResult = [
  {
    id: 'mockId',
    branchName: 'mockBranch1',
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
  },
  {
    id: 'mockId',
    branchName: 'mockBranch2',
    devhubId: '00D7Q000005YnXXXXX',
    devhubSfdxAuthUrl: 'force://mockDevHubUrl',
    name: 'Test Playground 2',
    projectName: 'Test Playground 2',
    sfdxAuthUrl: 'force://mockUrl2',
    revisionNumber: '0',
    slug: 'mock',
    state: 'active',
    salesforceId: 'mockId2',
    remainingDays: 1,
    projectId: 'mockProjectId',
    initialBranchName: 'master',
    globalId: 'mockGlobalId2',
    domain: 'CS162',
    createdAt: '2023-05-31T10:12:57.135Z',
    createdBy: 'Test User',
  },
  {
    id: 'mockId',
    branchName: 'mockBranch2',
    devhubId: '00D7Q000005YnXXXXX',
    devhubSfdxAuthUrl: 'force://mockDevHubUrl',
    name: 'Test Playground 3',
    projectName: 'Test Playground 3',
    sfdxAuthUrl: 'force://mockUrl3',
    revisionNumber: '0',
    slug: 'mock',
    state: 'active',
    salesforceId: 'mockId3',
    remainingDays: 1,
    projectId: 'mockProjectId',
    initialBranchName: 'master',
    globalId: 'mockGlobalId3',
    domain: 'CS162',
    createdAt: '2023-05-31T10:16:57.135Z',
    createdBy: 'Test User',
  },
];
