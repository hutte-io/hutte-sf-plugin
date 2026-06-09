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
    apiStubs.getSandboxAuthUrlByName.resolves('force://proxy@app.hutte.io');
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorizes the only sandbox (login only)', async () => {
    await Authorize.run([]);
    expect(apiStubs.getSandboxAuthUrl.calledOnceWith('t123', mockSandbox.id)).to.equal(true);
    expect(commonStubs.sandboxSfdxLogin.calledOnceWith(mockSandbox.name, 'force://proxy@app.hutte.io')).to.equal(true);
  });

  it('authorizes a sandbox by name via the by-name endpoint', async () => {
    await Authorize.run(['--sandbox-name', 'uat01']);
    expect(apiStubs.getSandboxes.called).to.equal(false);
    expect(apiStubs.getSandboxAuthUrlByName.calledOnce).to.equal(true);
    expect(apiStubs.getSandboxAuthUrlByName.firstCall.args[2]).to.equal('uat01');
    expect(commonStubs.sandboxSfdxLogin.calledOnceWith('uat01', 'force://proxy@app.hutte.io')).to.equal(true);
  });

  it('fails when the sandbox name does not exist', async () => {
    apiStubs.getSandboxAuthUrlByName.rejects(new SfError('Could not find a sandbox with that name in this project.'));

    try {
      await Authorize.run(['--sandbox-name', 'nonexistent']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Could not find a sandbox with that name/);
    }
  });

  it('surfaces the forbidden error for non-admins', async () => {
    apiStubs.getSandboxAuthUrlByName.rejects(new SfError('Only project admins can authorize sandboxes.'));

    try {
      await Authorize.run(['--sandbox-name', 'uat01']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Only project admins can authorize sandboxes/);
    }
  });

  it('surfaces the underlying sf error when the login fails', async () => {
    // Run the real sandboxSfdxLogin with cross-spawn stubbed to fail.
    commonStubs.sandboxSfdxLogin.restore();
    const crossSpawnStubs = stubCrossSpawnSync(testContext.SANDBOX);
    crossSpawnStubs.sync.returns({
      status: 1,
      signal: null,
      pid: 0,
      output: [],
      stdout: Buffer.from(''),
      stderr: Buffer.from('Invalid SFDX auth URL'),
    });

    try {
      await Authorize.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/Invalid SFDX auth URL/);
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
