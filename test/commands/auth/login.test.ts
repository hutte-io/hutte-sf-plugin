import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { stubMethod } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as api from '../../../src/api';
import { Login } from '../../../src/commands/hutte/auth/login';
import * as config from '../../../src/config';
import * as keychain from '../../../src/keychain';

describe('hutte:auth:login', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubMethod(testContext.SANDBOX, keychain, 'storeUserApiToken').resolves();
    stubMethod(testContext.SANDBOX, config, 'storeUserInfo').resolves();
  });

  afterEach(() => {
    testContext.restore();
  });

  it('works as expected in happy path', async () => {
    stubMethod(testContext.SANDBOX, api, 'promiseRequest').resolves({
      response: {
        statusCode: 500,
      },
      body: {
        error: 'no_active_org',
      },
    });
    stubMethod(testContext.SANDBOX, api, 'login').resolves({
      email: 'john.doe@example.org',
      userId: '123',
      apiToken: 't123',
    });
    const result = await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
    expect(result.userId).to.equal('123');
  });

  it('login fails when credentials are incorrect', async () => {
    stubMethod(testContext.SANDBOX, api, 'login').rejects('Invalid credentials');
    let err;
    try {
      await Login.run(['--email', 'test@email.com', '--password', 'mockPassword']);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/Invalid credentials/);
  });
});
