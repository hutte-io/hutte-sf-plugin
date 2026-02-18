import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Terminate } from '../../../src/commands/hutte/org/terminate.js';
import {
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  type ApiStubs,
  type CommonStubs,
} from '../../helpers.js';

describe('hutte:org:terminate', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);

    commonStubs.getDefaultOrgInfo.returns({
      id: 'mockOrgId',
      username: 'john.doe@example.com',
    });
  });

  afterEach(() => {
    testContext.restore();
  });

  it('terminate scratch org happy path', async () => {
    apiStubs.terminateOrg.resolves();
    await Terminate.run([]);
    expect(apiStubs.terminateOrg.calledOnce).to.be.true;
    expect(commonStubs.logoutFromDefault.calledOnce).to.be.true;
  });

  it('fails when the scratch org cannot be found in Hutte', async () => {
    apiStubs.terminateOrg.rejects(new Error('Could not find the scratch org on hutte'));

    try {
      await Terminate.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Could not find the scratch org on hutte/);
    }
  });

  it('fails when Hutte API returns an error response', async () => {
    apiStubs.terminateOrg.rejects(new Error('Request to hutte failed 500'));

    try {
      await Terminate.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Request to hutte failed/);
    }
  });
});
