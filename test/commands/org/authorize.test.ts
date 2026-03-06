import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Authorize } from '../../../src/commands/hutte/org/authorize.js';
import {
  createMockScratchOrg,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  stubCrossSpawnSync,
  stubProjectResolution,
  type ApiStubs,
  type CommonStubs,
  type CrossSpawnStubs,
} from '../../helpers.js';

describe('hutte:org:authorize', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockOrg = createMockScratchOrg();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;
  let crossSpawnStubs: CrossSpawnStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);
    stubProjectResolution(testContext.SANDBOX);
    crossSpawnStubs = stubCrossSpawnSync(testContext.SANDBOX);

    apiStubs.getScratchOrgs.resolves([mockOrg]);
    commonStubs.sfdxLogin.returns(mockOrg);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorize happy path', async () => {
    await Authorize.run([]);
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('authorize fails on unstaged changes', async () => {
    crossSpawnStubs.sync
      .withArgs('git', ['diff-index', '--quiet', 'HEAD', '--'])
      .returns({ status: 1, signal: null, pid: 0, output: [], stdout: Buffer.from(''), stderr: Buffer.from('') });

    try {
      await Authorize.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/unstaged changes/);
    }
  });

  it('authorize fails on sfdx error', async () => {
    const error = new Error('The login failed.');
    commonStubs.sfdxLogin.throws(error);

    try {
      await Authorize.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).cause).to.equal(error);
    }
  });

  it('authorize org by name', async () => {
    await Authorize.run(['--org-name', 'Test Playground 1']);
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('authorize fails when name does not exist', async () => {
    try {
      await Authorize.run(['--org-name', 'Non Existing']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is not any scratch org to authorize by the provided name/);
    }
  });

  it('skips git ops when --no-git is provided', async () => {
    await Authorize.run(['--no-git']);

    const gitCalls = crossSpawnStubs.sync.args.filter((args: unknown[]) => args[0] === 'git');
    expect(gitCalls).to.have.lengthOf(0);
  });
});
