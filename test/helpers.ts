import { type SinonSandbox, type SinonStub } from 'sinon';
import api, { type IScratchOrg, type IProject } from '../src/api.js';
import common from '../src/common.js';
import config from '../src/config.js';
import keychain from '../src/keychain.js';
import hutteProjectConfig from '../src/hutte-project-config.js';
import projectResolution from '../src/project-resolution.js';

/**
 * Default mock scratch org data for testing.
 */
const DEFAULT_SCRATCH_ORG: IScratchOrg = {
  id: 'mockId',
  branchName: 'mockBranch1',
  commitSha: '1234567890',
  devhubId: '00D7Q000005YnXXXXX',
  devhubSfdxAuthUrl: 'force://mockDevHubUrl',
  orgName: 'Test Playground 1',
  projectName: 'Test Playground 1',
  sfdxAuthUrl: 'force://mockUrl1',
  revisionNumber: '0',
  slug: 'mock',
  state: 'active',
  salesforceId: 'mockId',
  remainingDays: 1,
  projectId: 'mockProjectId',
  initialBranchName: 'master',
  globalId: 'mockGlobalId',
  domain: 'CS162',
  createdAt: '2023-05-31T10:11:57.135Z',
  createdBy: 'Test User',
  pool: false,
};

/**
 * Creates a mock IScratchOrg object with optional overrides.
 */
export function createMockScratchOrg(overrides?: Partial<IScratchOrg>): IScratchOrg {
  return { ...DEFAULT_SCRATCH_ORG, ...overrides };
}

/**
 * Creates multiple mock scratch orgs with incrementing values.
 */
export function createMockScratchOrgList(count: number): IScratchOrg[] {
  return Array.from({ length: count }, (_, i) =>
    createMockScratchOrg({
      id: `mockId${i + 1}`,
      branchName: `mockBranch${i + 1}`,
      orgName: `Test Playground ${i + 1}`,
      projectName: `Test Playground ${i + 1}`,
      sfdxAuthUrl: `force://mockUrl${i + 1}`,
      salesforceId: `mockId${i + 1}`,
      globalId: `mockGlobalId${i + 1}`,
    })
  );
}

/**
 * Default mock project data for testing.
 */
const DEFAULT_PROJECT: IProject = {
  id: 'mockProjectId',
  name: 'Mock Project',
  repository: 'mock-org/mock-repo',
  projectType: 'scratch_org',
};

/**
 * Creates a mock IProject object with optional overrides.
 */
export function createMockProject(overrides?: Partial<IProject>): IProject {
  return { ...DEFAULT_PROJECT, ...overrides };
}

/**
 * Creates multiple mock projects with incrementing values.
 */
export function createMockProjectList(count: number): IProject[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProject({
      id: `mockProjectId${i + 1}`,
      name: `Mock Project ${i + 1}`,
      repository: `mock-org/mock-repo-${i + 1}`,
    })
  );
}

export type ApiStubs = {
  login: SinonStub;
  getMe: SinonStub;
  getProjects: SinonStub;
  getScratchOrgs: SinonStub;
  takeOrgFromPool: SinonStub;
  terminateOrg: SinonStub;
};

/**
 * Stubs all API methods and returns the stub references.
 */
export function stubApiMethods(sandbox: SinonSandbox): ApiStubs {
  return {
    login: sandbox.stub(api, 'login'),
    getMe: sandbox.stub(api, 'getMe'),
    getProjects: sandbox.stub(api, 'getProjects'),
    getScratchOrgs: sandbox.stub(api, 'getScratchOrgs'),
    takeOrgFromPool: sandbox.stub(api, 'takeOrgFromPool'),
    terminateOrg: sandbox.stub(api, 'terminateOrg'),
  };
}

export type ConfigStubs = {
  getApiToken: SinonStub;
  storeUserInfo: SinonStub;
  storeUserApiToken: SinonStub;
};

/**
 * Stubs config and keychain methods with default resolved values.
 */
export function stubConfigMethods(sandbox: SinonSandbox, apiToken = 't123'): ConfigStubs {
  return {
    getApiToken: sandbox.stub(config, 'getApiToken').resolves(apiToken),
    storeUserInfo: sandbox.stub(config, 'storeUserInfo').resolves(),
    storeUserApiToken: sandbox.stub(keychain, 'storeUserApiToken').resolves(),
  };
}

export type CommonStubs = {
  projectRepoFromOrigin: SinonStub;
  sfdxLogin: SinonStub;
  getDefaultOrgInfo: SinonStub;
  logoutFromDefault: SinonStub;
};

/**
 * Stubs common utility methods with default values.
 */
export function stubCommonMethods(
  sandbox: SinonSandbox,
  repoUrl = 'https://github.com/mock-org/mock-repo.git'
): CommonStubs {
  return {
    projectRepoFromOrigin: sandbox.stub(common, 'projectRepoFromOrigin').returns(repoUrl),
    sfdxLogin: sandbox.stub(common, 'sfdxLogin'),
    getDefaultOrgInfo: sandbox.stub(common, 'getDefaultOrgInfo'),
    logoutFromDefault: sandbox.stub(common, 'logoutFromDefault'),
  };
}

export type ProjectConfigStubs = {
  getDefaultProject: SinonStub;
  storeDefaultProject: SinonStub;
  clearDefaultProject: SinonStub;
};

/**
 * Stubs hutte-project-config methods.
 */
export function stubProjectConfigMethods(sandbox: SinonSandbox): ProjectConfigStubs {
  return {
    getDefaultProject: sandbox.stub(hutteProjectConfig, 'getDefaultProject').resolves(undefined),
    storeDefaultProject: sandbox.stub(hutteProjectConfig, 'storeDefaultProject').resolves(),
    clearDefaultProject: sandbox.stub(hutteProjectConfig, 'clearDefaultProject').resolves(),
  };
}

export type ProjectResolutionStubs = {
  resolveProject: SinonStub;
};

/**
 * Stubs project resolution with a default git-based resolution.
 */
export function stubProjectResolution(sandbox: SinonSandbox, repoName = 'mock-org/mock-repo'): ProjectResolutionStubs {
  return {
    resolveProject: sandbox.stub(projectResolution, 'resolveProject').resolves({
      repoName,
      source: 'git' as const,
    }),
  };
}

/**
 * Default API token for tests.
 */
export const TEST_API_TOKEN = 't123';

/**
 * Default repo URL for tests.
 */
export const TEST_REPO_URL = 'https://github.com/mock-org/mock-repo.git';
