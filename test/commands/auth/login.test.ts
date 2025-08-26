import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import api from '../../../src/api.js';
import { Login } from '../../../src/commands/hutte/auth/login.js';
import config from '../../../src/config.js';
import keychain from '../../../src/keychain.js';

describe('hutte:auth:login', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    testContext.SANDBOX.stub(keychain, 'storeUserApiToken').resolves();
    testContext.SANDBOX.stub(config, 'storeUserInfo').resolves();
  });

  afterEach(() => {
    testContext.restore();
  });

  it('works as expected in happy path', async () => {
    testContext.SANDBOX.stub(api, 'promiseRequest').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 500,
      },
      body: {
        error: 'no_active_org',
      },
    });
    testContext.SANDBOX.stub(api, 'login').resolves({
      userId: '123',
      apiToken: 't123',
    });
    const result = await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
    expect(result.userId).to.equal('123');
  });

  it('login fails when credentials are incorrect', async () => {
    testContext.SANDBOX.stub(api, 'login').rejects('Invalid credentials');
    let err;
    try {
      await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/Invalid credentials/);
  });
});
