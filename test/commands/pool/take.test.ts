import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Take } from '../../../src/commands/hutte/pool/take.js';
import hutteProjectConfig from '../../../src/hutte-project-config.js';
import {
  createMockScratchOrg,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  type ApiStubs,
  type CommonStubs,
} from '../../helpers.js';

describe('hutte:pool:take', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockOrg = createMockScratchOrg();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined);
    apiStubs = stubApiMethods(testContext.SANDBOX);

    commonStubs.sfdxLogin.returns(mockOrg);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('works as expected in happy path', async () => {
    apiStubs.takeOrgFromPool.resolves(mockOrg);
    const result = await Take.run(['--name', 'mockOrg', '--timeout', '60', '--wait']);
    expect(result.projectId).to.equal('mockProjectId');
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('fails when pool is not configured', async () => {
    apiStubs.takeOrgFromPool.rejects(new SfError("This project doesn't have a pool defined."));

    try {
      await Take.run(['--name', 'mockOrg']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/This project doesn't have a pool defined/);
    }
  });

  it('fails when no active org in pool', async () => {
    apiStubs.takeOrgFromPool.rejects(new SfError('There is no active pool at the moment'));

    try {
      await Take.run(['--name', 'mockOrg']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is no active pool at the moment/);
    }
  });

  it('fails when authorization fails', async () => {
    apiStubs.takeOrgFromPool.rejects(new SfError('There is an error with authorization.'));

    try {
      await Take.run(['--name', 'mockOrg']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });
});
