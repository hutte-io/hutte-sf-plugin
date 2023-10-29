import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { stubMethod } from '@salesforce/ts-sinon';
import { expect } from 'chai';
import * as api from '../../../src/api';
import { Terminate } from '../../../src/commands/hutte/org/terminate';
import * as common from '../../../src/common';
import * as config from '../../../src/config';

describe('hutte:org:terminate', async () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
    stubSfCommandUx($$.SANDBOX);
    stubMethod($$.SANDBOX, common, 'projectRepoFromOrigin').returns('https://github.com/mock-org/mock-repo.git');
    stubMethod($$.SANDBOX, common, 'getDefaultOrgInfo').returns({ id: 'mockOrgId' });
    stubMethod($$.SANDBOX, config, 'getApiToken').resolves('t123');
    stubMethod($$.SANDBOX, common, 'logoutFromDefault').returns();
  });

  afterEach(() => {
    $$.restore();
  });

  it('terminate scratch org happy path', async () => {
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
      response: {
        statusCode: 200,
      },
    });
    await Terminate.run([]);
    expect(true);
  });

  it('fails when the scratch org cannot be found in Hutte', async () => {
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
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
    stubMethod($$.SANDBOX, api, 'promiseRequest').resolves({
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
