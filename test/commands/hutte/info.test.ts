import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { Info } from '../../../src/commands/hutte/info.js';
import api from '../../../src/api.js';
import hutteProjectConfig from '../../../src/hutte-project-config.js';
import { createMockProject, stubConfigMethods, type ConfigStubs } from '../../helpers.js';

describe('hutte:info', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  let configStubs: ConfigStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    configStubs = stubConfigMethods(testContext.SANDBOX);
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('returns user info and no default project when logged in', async () => {
    testContext.SANDBOX.stub(api, 'getMe').resolves({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      organizationName: 'Acme Corp',
    });

    const result = await Info.run([]);

    expect(result.user).to.deep.equal({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      organizationName: 'Acme Corp',
    });
    expect(result.defaultProject).to.eq(null);
  });

  it('returns user info and default project when both are available', async () => {
    testContext.SANDBOX.restore();
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    configStubs = stubConfigMethods(testContext.SANDBOX);

    testContext.SANDBOX.stub(api, 'getMe').resolves({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      organizationName: 'Acme Corp',
    });

    const mockProject = createMockProject({ id: 'proj-123', name: 'My Project', repository: 'org/my-repo' });
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(mockProject);

    const result = await Info.run([]);

    expect(result.user).to.deep.equal({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      organizationName: 'Acme Corp',
    });
    expect(result.defaultProject).to.deep.equal({
      id: 'proj-123',
      name: 'My Project',
      repository: 'org/my-repo',
    });
  });

  it('returns null user when not logged in', async () => {
    configStubs.getApiToken.rejects(new Error('No token'));

    const result = await Info.run([]);

    expect(result.user).to.eq(null);
    expect(result.defaultProject).to.eq(null);
  });

  it('returns null user when getMe returns 401', async () => {
    testContext.SANDBOX.stub(api, 'getMe').rejects(new Error('Authorization failed'));

    const result = await Info.run([]);

    expect(result.user).to.eq(null);
  });
});
