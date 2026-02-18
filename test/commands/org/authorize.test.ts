import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { type SinonStub } from 'sinon';
import { Authorize } from '../../../src/commands/hutte/org/authorize.js';
import {
  createMockScratchOrg,
  stubApiMethods,
  stubConfigMethods,
  stubCommonMethods,
  TEST_REPO_URL,
  TEST_API_TOKEN,
  type ApiStubs,
  type CommonStubs,
} from '../../helpers.js';

describe('hutte:org:authorize', () => {
  const testContext = new TestContext();
  const testOrg = new MockTestOrgData();
  const mockOrg = createMockScratchOrg();
  let apiStubs: ApiStubs;
  let commonStubs: CommonStubs;
  let privateStubs: {
    checkoutGitBranch: SinonStub;
    sfdxPull: SinonStub;
    checkUnstagedChanges: SinonStub;
  };

  beforeEach(async () => {
    await testContext.stubAuths(testOrg);
    stubSfCommandUx(testContext.SANDBOX);
    apiStubs = stubApiMethods(testContext.SANDBOX);
    stubConfigMethods(testContext.SANDBOX);
    commonStubs = stubCommonMethods(testContext.SANDBOX);

    apiStubs.getScratchOrgs.withArgs(TEST_API_TOKEN, TEST_REPO_URL).resolves([mockOrg]);
    commonStubs.sfdxLogin.returns(mockOrg);

    privateStubs = {
      // @ts-expect-error private instance method
      checkoutGitBranch: testContext.SANDBOX.stub(Authorize.prototype, 'checkoutGitBranch').returns(mockOrg),
      // @ts-expect-error private instance method
      sfdxPull: testContext.SANDBOX.stub(Authorize.prototype, 'sfdxPull').returns(mockOrg),
      // @ts-expect-error private instance method
      checkUnstagedChanges: testContext.SANDBOX.stub(Authorize.prototype, 'checkUnstagedChanges').returns(),
    };
  });

  afterEach(() => {
    testContext.restore();
  });

  it('authorize happy path', async () => {
    await Authorize.run([]);
    expect(commonStubs.sfdxLogin.calledOnce).to.be.true;
  });

  it('authorize fails on unstaged changes', async () => {
    const error = new Error('You have unstaged changes. Please commit or stash them before proceeding.');
    privateStubs.checkUnstagedChanges.throws(error);

    try {
      await Authorize.run([]);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).cause).to.equal(error);
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
    expect(commonStubs.sfdxLogin.calledOnce).to.be.true;
  });

  it('authorize fails when name does not exist', async () => {
    try {
      await Authorize.run(['--org-name', 'Non Existing']);
      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(SfError);
      expect((e as SfError).cause).to.match(
        /There is not any scratch org to authorize by the provided name/,
      );
    }
  });

  it('skips git ops when --no-git is provided', async () => {
    await Authorize.run(['--no-git']);

    expect(privateStubs.checkUnstagedChanges.called).to.be.false;
    expect(privateStubs.checkoutGitBranch.called).to.be.false;
  });
});
