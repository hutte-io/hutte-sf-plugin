import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { List } from '../../../src/commands/hutte/sandbox/list.js';
import {
  createMockSandboxList,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  stubProjectResolution,
  type ApiStubs,
} from '../../helpers.js';

describe('hutte:sandbox:list', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockSandboxes = createMockSandboxList(3);
  let apiStubs: ApiStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubCommonMethods(testContext.SANDBOX, '');
    stubConfigMethods(testContext.SANDBOX);
    stubProjectResolution(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    apiStubs.getSandboxes.resolves(mockSandboxes);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('lists the project sandboxes', async () => {
    const result = await List.run([]);
    expect(result).to.have.lengthOf(3);
    expect(result[0].name).to.equal('uat01');
    expect(result[0].salesforceStatus).to.equal('completed');
    expect(result[0].licenseType).to.equal('DEVELOPER');
  });

  it('fails when authorization fails', async () => {
    apiStubs.getSandboxes.rejects(new SfError('There is an error with authorization.'));

    try {
      await List.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });

  it('fails when server returns an error', async () => {
    apiStubs.getSandboxes.rejects(new SfError('Request to Hutte failed.'));

    try {
      await List.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Request to Hutte failed/);
    }
  });
});
