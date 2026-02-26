import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { Scratch } from '../../../../src/commands/hutte/org/create/scratch.js';
import { type ICreateScratchOrgRequest } from '../../../../src/api.js';
import {
  createMockScratchOrg,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  type ApiStubs,
  type CommonStubs,
} from '../../../helpers.js';

describe('hutte:org:create:scratch', () => {
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

  it('creates org and waits for active state (default behavior)', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    const result = await Scratch.run(['--name', 'Test Org']);

    expect(result.state).to.equal('active');
    expect(apiStubs.createScratchOrg.calledOnce).to.equal(true);
    expect(commonStubs.pollForOrgStatus.calledOnce).to.equal(true);
    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
  });

  it('returns immediately with --async flag', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });

    apiStubs.createScratchOrg.resolves(creatingOrg);

    const result = await Scratch.run(['--name', 'Test Org', '--async']);

    expect(result.state).to.equal('creating');
    expect(apiStubs.createScratchOrg.calledOnce).to.equal(true);
    expect(commonStubs.pollForOrgStatus.called).to.equal(false);
    expect(commonStubs.sfdxLogin.called).to.equal(false);
  });

  it('authenticates when org becomes active', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active', sfdxAuthUrl: 'force://mockUrl' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--name', 'Test Org']);

    expect(commonStubs.sfdxLogin.calledOnce).to.equal(true);
    expect(commonStubs.sfdxLogin.calledWith(activeOrg)).to.equal(true);
  });

  it('throws error on failed state', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const failedOrg = createMockScratchOrg({ state: 'failed' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--name', 'Test Org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/creation failed/i);
    }
  });

  it('throws error on setup_failed state', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const failedOrg = createMockScratchOrg({ state: 'setup_failed' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--name', 'Test Org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/setup failed/i);
    }
  });

  it('throws error on push_failed state', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const failedOrg = createMockScratchOrg({ state: 'push_failed' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(failedOrg);

    try {
      await Scratch.run(['--name', 'Test Org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/push failed/i);
    }
  });

  it('throws error on timeout', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.rejects(new SfError('Timed out waiting for scratch org to be ready.'));

    try {
      await Scratch.run(['--name', 'Test Org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/timed out/i);
    }
  });

  it('passes timeout actions with resume suggestion to pollForOrgStatus', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--name', 'Test Org']);

    const pollOptions = commonStubs.pollForOrgStatus.firstCall.args[1] as { timeoutActions: string[] };
    expect(pollOptions.timeoutActions).to.be.an('array').with.lengthOf(2);
    expect(pollOptions.timeoutActions[0]).to.include(`--scratch-org-id ${creatingOrg.id}`);
    expect(pollOptions.timeoutActions[0]).to.include('sf hutte org resume scratch');
    expect(pollOptions.timeoutActions[1]).to.include('--wait');
  });

  it('handles authorization error', async () => {
    apiStubs.createScratchOrg.rejects(new SfError('There is an error with authorization.'));

    try {
      await Scratch.run(['--name', 'Test Org']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/authorization/i);
    }
  });

  it('passes initial branch from flag', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--name', 'Test Org', '--initial-branch', 'develop']);

    expect(apiStubs.createScratchOrg.calledOnce).to.equal(true);
    const callArgs = apiStubs.createScratchOrg.firstCall.args as [string, ICreateScratchOrgRequest];
    expect(callArgs[1].initialBranchName).to.equal('develop');
  });

  it('uses current branch when initial-branch flag not provided', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active' });

    commonStubs.getCurrentBranch.returns('feature/my-feature');
    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run(['--name', 'Test Org']);

    expect(commonStubs.getCurrentBranch.calledOnce).to.equal(true);
    const callArgs = apiStubs.createScratchOrg.firstCall.args as [string, ICreateScratchOrgRequest];
    expect(callArgs[1].initialBranchName).to.equal('feature/my-feature');
  });

  it('passes optional flags to API', async () => {
    const creatingOrg = createMockScratchOrg({ state: 'creating' });
    const activeOrg = createMockScratchOrg({ state: 'active' });

    apiStubs.createScratchOrg.resolves(creatingOrg);
    commonStubs.pollForOrgStatus.resolves(activeOrg);
    commonStubs.sfdxLogin.returns(activeOrg);

    await Scratch.run([
      '--name',
      'Test Org',
      '--branch',
      'feature/test',
      '--duration-days',
      '7',
      '--no-ancestors',
      '--no-namespace',
      '--issue',
      'https://jira.example.com/PROJ-123',
      '--notes',
      'Test notes',
    ]);

    expect(apiStubs.createScratchOrg.calledOnce).to.equal(true);
    const callArgs = apiStubs.createScratchOrg.firstCall.args as [string, ICreateScratchOrgRequest];
    expect(callArgs[1].branchName).to.equal('feature/test');
    expect(callArgs[1].durationDays).to.equal(7);
    expect(callArgs[1].noAncestors).to.equal(true);
    expect(callArgs[1].noNamespace).to.equal(true);
    expect(callArgs[1].issueReference).to.equal('https://jira.example.com/PROJ-123');
    expect(callArgs[1].notes).to.equal('Test notes');
  });
});
