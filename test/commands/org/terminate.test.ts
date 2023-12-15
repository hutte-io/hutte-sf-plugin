import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import * as api from '../../../src/api';
import { Terminate } from '../../../src/commands/hutte/org/terminate';
import * as common from '../../../src/common';
import * as config from '../../../src/config';

describe('hutte:org:terminate', async () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    testContext.SANDBOX.stub(common, 'getDefaultOrgInfo').returns({
      id: 'mockOrgId',
      username: 'john.doe@example.com',
    });
    testContext.SANDBOX.stub(config, 'getApiToken').resolves('t123');
    testContext.SANDBOX.stub(common, 'logoutFromDefault').returns();
  });

  afterEach(() => {
    testContext.restore();
  });

  it('terminate scratch org happy path', async () => {
    testContext.SANDBOX.stub(api, 'promiseRequest').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 200,
      },
    });
    await Terminate.run([]);
    expect(true);
  });

  it('fails when the scratch org cannot be found in Hutte', async () => {
    testContext.SANDBOX.stub(api, 'promiseRequest').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 404,
      },
    });
    let err;
    try {
      await Terminate.run([]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/Could not find the scratch org on hutte/);
  });

  it('fails when Hutte API returns an error response', async () => {
    testContext.SANDBOX.stub(api, 'promiseRequest').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 500,
      },
    });
    let err;
    try {
      await Terminate.run([]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/Request to hutte failed/);
  });
});
