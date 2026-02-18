import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { List } from '../../../src/commands/hutte/org/list.js';
import {
  createMockScratchOrgList,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  type ApiStubs,
} from '../../helpers.js';

describe('hutte:org:list', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockOrgList = createMockScratchOrgList(3);
  let apiStubs: ApiStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubCommonMethods(testContext.SANDBOX, '');
    stubConfigMethods(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);

    apiStubs.getScratchOrgs.resolves(mockOrgList);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('happy path, returns all details', async () => {
    const result = await List.run(['--verbose']);
    expect(result).to.have.lengthOf(3);
    expect(result[0].orgName).to.equal('Test Playground 1');
    expect(result[0].projectName).to.equal('Test Playground 1');
    expect(result[0].state).to.equal('active');
    expect(result[0].devhubSfdxAuthUrl).to.equal('force://mockDevHubUrl');
    expect(result[0].sfdxAuthUrl).to.equal('force://mockUrl1');
  });

  it('happy path, returns basic details', async () => {
    const result = await List.run([]);
    expect(result).to.have.lengthOf(3);
    expect(result[0].orgName).to.equal('Test Playground 1');
    expect(result[0].projectName).to.equal('Test Playground 1');
    expect(result[0].state).to.equal('active');
    expect(result[0].devhubSfdxAuthUrl).to.be.undefined;
    expect(result[0].sfdxAuthUrl).to.be.undefined;
  });
});
