import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Authorize } from '../../../src/commands/hutte/sandbox/authorize.js';
import {
  createMockSandbox,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  stubCrossSpawnSync,
  stubProjectResolution,
  type ApiStubs,
  type CommonStubs,
} from '../../helpers.js';

describe('hutte:sandbox:authorize', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockSandbox = createMockSandbox();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);
    stubProjectResolution(testContext.SANDBOX);

    apiStubs.getSandboxes.resolves([mockSandbox]);
    apiStubs.getSandboxAuthUrl.resolves('force://proxy@app.hutte.io');
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorizes the only sandbox (login only)', async () => {
    await Authorize.run([]);
    expect(apiStubs.getSandboxAuthUrl.calledOnceWith('t123', mockSandbox.id)).to.equal(true);
    expect(commonStubs.sandboxSfdxLogin.calledOnceWith(mockSandbox.name, 'force://proxy@app.hutte.io')).to.equal(true);
  });

  it('authorizes a sandbox by name', async () => {
    await Authorize.run(['--sandbox-name', 'uat01']);
    expect(commonStubs.sandboxSfdxLogin.calledOnce).to.equal(true);
  });

  it('fails when the sandbox name does not exist', async () => {
    try {
      await Authorize.run(['--sandbox-name', 'nonexistent']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/not any sandbox to authorize/);
    }
  });

  it('surfaces the forbidden error for non-admins', async () => {
    apiStubs.getSandboxAuthUrl.rejects(new SfError('Only project admins can authorize sandboxes.'));

    try {
      await Authorize.run(['--sandbox-name', 'uat01']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Only project admins can authorize sandboxes/);
    }
  });

  it('runs no git commands, only the sf login (login only)', async () => {
    // Restore the helper stub so the REAL sandboxSfdxLogin runs (with crossSpawn stubbed).
    commonStubs.sandboxSfdxLogin.restore();
    const crossSpawnStubs = stubCrossSpawnSync(testContext.SANDBOX);

    await Authorize.run([]);

    const gitCalls = crossSpawnStubs.sync.args.filter((args: unknown[]) => args[0] === 'git');
    expect(gitCalls).to.have.lengthOf(0);

    const sfLoginCalls = crossSpawnStubs.sync.args.filter(
      (args: unknown[]) => args[0] === 'sf' && Array.isArray(args[1]) && (args[1] as string[]).includes('sfdx-url')
    );
    expect(sfLoginCalls).to.have.lengthOf(1);
  });
});
