import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Login } from '../../../src/commands/hutte/auth/login.js';
import { stubApiMethods, stubConfigMethods, type ApiStubs, type ConfigStubs } from '../../helpers.js';

describe('hutte:auth:login', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  let apiStubs: ApiStubs;
  let configStubs: ConfigStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    configStubs = stubConfigMethods(testContext.SANDBOX);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('works as expected in happy path', async () => {
    apiStubs.login.resolves({
      userId: '123',
      apiToken: 't123',
    });
    const result = await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
    expect(result.userId).to.equal('123');
    expect(configStubs.storeUserInfo.calledOnce).to.equal(true);
    expect(configStubs.storeUserApiToken.calledOnce).to.equal(true);
  });

  it('login fails when credentials are incorrect', async () => {
    apiStubs.login.rejects(new SfError('There is an error with authorization.'));

    try {
      await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });
});
