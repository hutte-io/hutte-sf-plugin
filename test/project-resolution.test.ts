import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import projectResolution from '../src/project-resolution.js';
import api from '../src/api.js';
import common from '../src/common.js';
import hutteProjectConfig from '../src/hutte-project-config.js';
import { createMockProject, TEST_API_TOKEN } from './helpers.js';

describe('project-resolution', () => {
  const testContext = new TestContext();

  afterEach(() => {
    testContext.restore();
  });

  it('uses flag project-id when provided', async () => {
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined);

    const result = await projectResolution.resolveProject(TEST_API_TOKEN, 'flag-project-id');

    expect(result.projectId).to.equal('flag-project-id');
    expect(result.repoName).to.equal(undefined);
    expect(result.source).to.equal('flag');
  });

  it('uses stored default project when user has access', async () => {
    const mockProject = createMockProject({ id: 'stored-id', repository: 'stored-org/stored-repo' });
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('git-org/git-repo');
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(mockProject);
    testContext.SANDBOX.stub(api, 'getProjects').resolves([
      createMockProject({ id: 'stored-id', repository: 'stored-org/stored-repo' }),
    ]);

    const result = await projectResolution.resolveProject(TEST_API_TOKEN);

    expect(result.projectId).to.equal('stored-id');
    expect(result.repoName).to.equal('stored-org/stored-repo');
    expect(result.source).to.equal('default');
  });

  it('falls back to git when stored default is not accessible to current user', async () => {
    const mockProject = createMockProject({ id: 'stored-id', repository: 'stored-org/stored-repo' });
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('git-org/git-repo');
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(mockProject);
    testContext.SANDBOX.stub(api, 'getProjects').resolves([
      createMockProject({ id: 'other-id', repository: 'other-org/other-repo' }),
    ]);

    const result = await projectResolution.resolveProject(TEST_API_TOKEN);

    expect(result.projectId).to.eq(undefined);
    expect(result.repoName).to.equal('stored-org/stored-repo');
    expect(result.source).to.equal('git');
  });

  it('falls back to git-based resolution when no flag or default', async () => {
    testContext.SANDBOX.stub(common, 'projectRepoFromOrigin').returns('git-org/git-repo');
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined);

    const result = await projectResolution.resolveProject(TEST_API_TOKEN);

    expect(result.projectId).to.eq(undefined);
    expect(result.repoName).to.equal('git-org/git-repo');
    expect(result.source).to.equal('git');
  });

  it('flag overrides stored default', async () => {
    const mockProject = createMockProject({ id: 'stored-id' });
    testContext.SANDBOX.stub(hutteProjectConfig, 'getDefaultProject').resolves(mockProject);

    const result = await projectResolution.resolveProject(TEST_API_TOKEN, 'override-id');

    expect(result.projectId).to.equal('override-id');
    expect(result.repoName).to.equal(undefined);
    expect(result.source).to.equal('flag');
  });
});
