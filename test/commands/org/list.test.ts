import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
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
    expect(result[0].devhubSfdxAuthUrl).to.equal(undefined);
    expect(result[0].sfdxAuthUrl).to.equal(undefined);
  });

  it('fails when authorization fails', async () => {
    apiStubs.getScratchOrgs.rejects(new SfError('There is an error with authorization.'));

    try {
      await List.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });

  it('fails when server returns an error', async () => {
    apiStubs.getScratchOrgs.rejects(new SfError('Request to Hutte failed.'));

    try {
      await List.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Request to Hutte failed/);
    }
  });
});
