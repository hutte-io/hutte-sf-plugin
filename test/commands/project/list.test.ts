import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { List } from '../../../src/commands/hutte/project/list.js';
import {
  createMockProject,
  createMockProjectList,
  stubApiMethods,
  stubConfigMethods,
  type ApiStubs,
} from '../../helpers.js';

describe('hutte:project:list', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockProjectList = createMockProjectList(3);
  let apiStubs: ApiStubs;

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);

    apiStubs.getProjects.resolves(mockProjectList);
  });

  afterEach(() => {
    testContext.restore();
  });

  it('happy path, returns projects', async () => {
    const result = await List.run([]);
    expect(result).to.have.lengthOf(3);
    expect(result[0].id).to.equal('mockProjectId1');
    expect(result[0].name).to.equal('Mock Project 1');
    expect(result[0].repository).to.equal('mock-org/mock-repo-1');
    expect(result[0].projectType).to.equal('scratch_org');
  });

  it('passes --api-token flag to getProjects', async () => {
    await List.run(['--api-token', 'custom-token']);
    expect(apiStubs.getProjects.calledWith('custom-token')).to.equal(true);
  });

  it('filters out sandbox projects', async () => {
    const mixedProjects = [
      createMockProject({ id: 'scratch1', name: 'Scratch Project', projectType: 'scratch_org' }),
      createMockProject({ id: 'sandbox1', name: 'Sandbox Project', projectType: 'sandbox' }),
    ];
    apiStubs.getProjects.resolves(mixedProjects);

    const result = await List.run([]);
    expect(result).to.have.lengthOf(1);
    expect(result[0].id).to.equal('scratch1');
  });

  it('fails when authorization fails', async () => {
    apiStubs.getProjects.rejects(new SfError('There is an error with authorization.'));

    try {
      await List.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).message).to.match(/There is an error with authorization/);
    }
  });
});
