import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Scratch } from '../../../../src/commands/hutte/org/resume/scratch.js';
import {
  createMockScratchOrg,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  type ApiStubs,
  type CommonStubs,
} from '../../../helpers.js';

describe('hutte:org:resume:scratch', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('resumes and polls until active state', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const activeOrg = createMockScratchOrg({ id: 'org-123', state: 'active' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    const result = await Scratch.run(['--scratch-org-id', 'org-123']);

    expect(result.state).to.equal('active');
    expect(apiStubs.getScratchOrg.calledOnce).to.equal(true);
    expect(commonStubs.pollForOrgStatus.calledOnce).to.equal(true);
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('authenticates when org becomes active', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const activeOrg = createMockScratchOrg({ id: 'org-123', state: 'active', sfdxAuthUrl: 'force://mockUrl' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--scratch-org-id', 'org-123']);

    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
    expect(commonStubs.sfdxLogin.calledWith(activeOrg)).to.equal(true);
  });

  it('handles already active org without polling', async () => {
    const activeOrg = createMockScratchOrg({ id: 'org-123', state: 'active' });

    apiStubs.getScratchOrg.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    const result = await Scratch.run(['--scratch-org-id', 'org-123']);

    expect(result.state).to.equal('active');
    expect(apiStubs.getScratchOrg.calledOnce).to.equal(true);
    expect(commonStubs.pollForOrgStatus.called).to.equal(false);
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('throws error on failed state', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const failedOrg = createMockScratchOrg({ id: 'org-123', state: 'failed' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/creation failed/i);
    }
  });

  it('throws error on setup_failed state', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const failedOrg = createMockScratchOrg({ id: 'org-123', state: 'setup_failed' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/setup failed/i);
    }
  });

  it('throws error on push_failed state', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const failedOrg = createMockScratchOrg({ id: 'org-123', state: 'push_failed' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/push failed/i);
    }
  });

  it('throws error on timeout', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.rejects(new SfError('Timed out waiting for scratch org to be ready.'));

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/timed out/i);
    }
  });

  it('passes timeout actions with wait suggestion to pollForOrgStatus', async () => {
    const creatingOrg = createMockScratchOrg({ id: 'org-123', state: 'creating' });
    const activeOrg = createMockScratchOrg({ id: 'org-123', state: 'active' });

    apiStubs.getScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--scratch-org-id', 'org-123']);

    const pollOptions = commonStubs.pollForOrgStatus.firstCall.args[1] as { timeoutActions: string[] };
    expect(pollOptions.timeoutActions).to.be.an('array').with.lengthOf(1);
    expect(pollOptions.timeoutActions[0]).to.include('--wait');
  });

  it('handles org not found error', async () => {
    apiStubs.getScratchOrg.rejects(new SfError('Could not find the scratch org on Hutte.'));

    try {
      await Scratch.run(['--scratch-org-id', 'nonexistent-org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/could not find/i);
    }
  });

  it('handles authorization error', async () => {
    apiStubs.getScratchOrg.rejects(new SfError('There is an error with authorization.'));

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/authorization/i);
    }
  });

  it('throws error when org is already failed on initial fetch', async () => {
    const failedOrg = createMockScratchOrg({ id: 'org-123', state: 'failed' });

    apiStubs.getScratchOrg.resolves(failedOrg);

    try {
      await Scratch.run(['--scratch-org-id', 'org-123']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/creation failed/i);
    }
  });
});
