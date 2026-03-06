import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { ProjectSet } from '../../../src/commands/hutte/project/set.js';
import hutteProjectConfig from '../../../src/hutte-project-config.js';
import {
  createMockProject,
  createMockProjectList,
  stubApiMethods,
  stubConfigMethods,
  type ApiStubs,
} from '../../helpers.js';

describe('hutte:project:set', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockProjectList = createMockProjectList(3);
  let apiStubs: ApiStubs;
  let storeStub: sinon.SinonStub;
  let clearStub: sinon.SinonStub;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    storeStub = testContext.SANDBOX.stub(hutteProjectConfig, 'storeDefaultProject').resolves();
    clearStub = testContext.SANDBOX.stub(hutteProjectConfig, 'clearDefaultProject').resolves();
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined);

    apiStubs.getProjects.resolves(mockProjectList);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('sets default project by project-id flag', async () => {
    await ProjectSet.run(['--project-id', 'mockProjectId1']);

    expect(storeStub.calledOnce).to.equal(true);
    expect(storeStub.firstCall.args[0]).to.deep.include({
      id: 'mockProjectId1',
      name: 'Mock Project 1',
    });
    expect(storeStub.firstCall.args[1]).to.equal(false);
  });

  it('sets default project globally with --global flag', async () => {
    await ProjectSet.run(['--project-id', 'mockProjectId1', '--global']);

    expect(storeStub.calledOnce).to.equal(true);
    expect(storeStub.firstCall.args[0]).to.deep.include({
      id: 'mockProjectId1',
      name: 'Mock Project 1',
    });
    expect(storeStub.firstCall.args[1]).to.equal(true);
  });

  it('clears default project with --clear flag', async () => {
    await ProjectSet.run(['--clear']);

    expect(clearStub.calledOnce).to.equal(true);
    expect(clearStub.firstCall.args[0]).to.equal(false);
    expect(apiStubs.getProjects.called).to.equal(false);
  });

  it('clears global default project with --clear --global', async () => {
    await ProjectSet.run(['--clear', '--global']);

    expect(clearStub.calledOnce).to.equal(true);
    expect(clearStub.firstCall.args[0]).to.equal(true);
    expect(apiStubs.getProjects.called).to.equal(false);
  });

  it('fails when no projects are found', async () => {
    apiStubs.getProjects.resolves([]);

    try {
      await ProjectSet.run(['--project-id', 'nonexistent']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
    }
  });

  it('fails when project-id does not match any project', async () => {
    try {
      await ProjectSet.run(['--project-id', 'nonexistent']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
    }
  });

  it('passes api token flag to getProjects', async () => {
    await ProjectSet.run(['--api-token', 'custom-token', '--project-id', 'mockProjectId1']);
    expect(apiStubs.getProjects.calledWith('custom-token')).to.equal(true);
  });

  it('fails when authorization fails', async () => {
    apiStubs.getProjects.rejects(new SfError('There is an error with authorization.'));

    try {
      await ProjectSet.run(['--project-id', 'mockProjectId1']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });

  it('filters out sandbox projects', async () => {
    const mixedProjects = [
      createMockProject({ id: 'scratch1', name: 'Scratch Project', projectType: 'scratch_org' }),
      createMockProject({ id: 'sandbox1', name: 'Sandbox Project', projectType: 'sandbox' }),
    ];
    apiStubs.getProjects.resolves(mixedProjects);

    await ProjectSet.run(['--project-id', 'scratch1']);

    expect(storeStub.calledOnce).to.equal(true);
    expect(storeStub.firstCall.args[0]).to.deep.include({ id: 'scratch1' });
  });

  it('fails when only sandbox projects exist', async () => {
    const sandboxOnly = [createMockProject({ id: 'sandbox1', name: 'Sandbox Project', projectType: 'sandbox' })];
    apiStubs.getProjects.resolves(sandboxOnly);

    try {
      await ProjectSet.run(['--project-id', 'sandbox1']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
    }
  });
});
