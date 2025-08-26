import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { assert, expect } from 'chai';
import api from '../../../src/api.js';
import { Terminate } from '../../../src/commands/hutte/org/terminate.js';
import common from '../../../src/common.js';
import config from '../../../src/config.js';
import { SfError } from '@salesforce/core';

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
    testContext.SANDBOX.stub(api, 'terminateOrg').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 200,
      },
    });
    await Terminate.run([]);
    expect(true);
  });

  it('fails when the scratch org cannot be found in Hutte', async () => {
    testContext.SANDBOX.stub(api, 'terminateOrg').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 404,
      },
    });
    try {
      await Terminate.run([]);
      assert(false, 'should throw an error');
    } catch (e) {
      assert(e instanceof SfError);
      if (e instanceof SfError) {
        expect(e.message).to.match(/Could not find the scratch org on hutte/);
      }
    }
  });

  it('fails when Hutte API returns an error response', async () => {
    testContext.SANDBOX.stub(api, 'terminateOrg').resolves({
      // @ts-expect-error not the full Response
      response: {
        statusCode: 500,
      },
    });
    try {
      await Terminate.run([]);
      assert(false, 'should throw an error');
    } catch (e) {
      assert(e instanceof SfError);
      if (e instanceof SfError) {
        expect(e.message).to.match(/Request to hutte failed/);
      }
    }
  });
});
