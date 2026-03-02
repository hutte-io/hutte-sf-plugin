/* eslint-disable camelcase */
import { expect } from 'chai';
import sinon, { type SinonStub } from 'sinon';
import { SfError } from '@salesforce/core';
import api, { type IScratchOrgResponse } from '../src/api.js';
import { type ResolvedProject } from '../src/types.js';

const gitProject = (repoName: string): ResolvedProject => ({ repoName, source: 'git' });

describe('api', () => {
  let fetchStub: SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    sinon.restore();
  });

  const mockResponse = (status: number, body: unknown = {}): Response =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response);

  describe('login', () => {
    it('returns userId and apiToken on success', async () => {
      fetchStub.resolves(
        mockResponse(200, {
          data: { api_token: 'token123', user_id: 'user456' },
        })
      );

      const result = await api.login('test@example.com', 'password123');

      expect(result.apiToken).to.equal('token123');
      expect(result.userId).to.equal('user456');
      expect(fetchStub.calledOnce).to.equal(true);

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url, options] = callArgs;
      expect(url).to.include('/api_tokens');
      expect(options.method).to.equal('POST');
      expect(JSON.parse(options.body as string)).to.deep.equal({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws authorization error on 401', async () => {
      fetchStub.resolves(mockResponse(401));

      try {
        await api.login('test@example.com', 'wrongpassword');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws authorization error on 400', async () => {
      fetchStub.resolves(mockResponse(400));

      try {
        await api.login('test@example.com', 'password');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws network error when fetch fails', async () => {
      const networkError = new TypeError('fetch failed');
      fetchStub.rejects(networkError);

      try {
        await api.login('test@example.com', 'password');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
        expect((e as SfError).cause).to.equal(networkError);
      }
    });
  });

  describe('getScratchOrgs', () => {
    const mockOrgData: IScratchOrgResponse = {
      id: 'org1',
      branch_name: 'feature-1',
      commit_sha: 'abc123',
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'user@example.com',
      devhub_id: 'devhub1',
      devhub_sfdx_auth_url: 'force://devhub',
      domain: 'CS1',
      gid: 'gid1',
      initial_branch_name: 'main',
      name: 'My Org',
      project_id: 'proj1',
      project_name: 'My Project',
      remaining_days: '7',
      revision_number: '1',
      salesforce_id: 'sf1',
      sfdx_auth_url: 'force://org',
      slug: 'my-org',
      state: 'active',
      pool: false,
    };

    it('returns mapped scratch orgs on success', async () => {
      fetchStub.resolves(mockResponse(200, { data: [mockOrgData] }));

      const result = await api.getScratchOrgs('token123', gitProject('my-repo'));

      expect(result).to.have.lengthOf(1);
      expect(result[0].id).to.equal('org1');
      expect(result[0].branchName).to.equal('feature-1');
      expect(result[0].orgName).to.equal('My Org');
      expect(result[0].remainingDays).to.equal(7);

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url] = callArgs;
      expect(url).to.include('/scratch_orgs');
      expect(url).to.include('repo_name=my-repo');
    });

    it('passes includeAll parameter', async () => {
      fetchStub.resolves(mockResponse(200, { data: [] }));

      await api.getScratchOrgs('token123', gitProject('my-repo'), true);

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url] = callArgs;
      expect(url).to.include('all=true');
    });

    it('throws authorization error on 401', async () => {
      fetchStub.resolves(mockResponse(401));

      try {
        await api.getScratchOrgs('invalid-token', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws server error on 500', async () => {
      fetchStub.resolves(mockResponse(500));

      try {
        await api.getScratchOrgs('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 503', async () => {
      fetchStub.resolves(mockResponse(503));

      try {
        await api.getScratchOrgs('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when fetch fails', async () => {
      fetchStub.rejects(new TypeError('fetch failed'));

      try {
        await api.getScratchOrgs('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
      }
    });
  });

  describe('takeOrgFromPool', () => {
    const mockOrgData: IScratchOrgResponse = {
      id: 'org1',
      branch_name: 'pool-org',
      commit_sha: 'def456',
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'pool@example.com',
      devhub_id: 'devhub1',
      devhub_sfdx_auth_url: 'force://devhub',
      domain: 'CS2',
      gid: 'gid2',
      initial_branch_name: 'main',
      name: 'Pool Org',
      project_id: 'proj1',
      project_name: 'My Project',
      remaining_days: '14',
      revision_number: null,
      salesforce_id: 'sf2',
      sfdx_auth_url: 'force://poolorg',
      slug: 'pool-org',
      state: 'active',
      pool: true,
    };

    it('returns mapped scratch org on success', async () => {
      fetchStub.resolves(mockResponse(200, { data: mockOrgData }));

      const result = await api.takeOrgFromPool('token123', gitProject('my-repo'));

      expect(result.id).to.equal('org1');
      expect(result.orgName).to.equal('Pool Org');
      expect(result.pool).to.equal(true);

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url, options] = callArgs;
      expect(url).to.include('/take_from_pool');
      expect(options.method).to.equal('POST');
    });

    it('passes orgName parameter', async () => {
      fetchStub.resolves(mockResponse(200, { data: mockOrgData }));

      await api.takeOrgFromPool('token123', gitProject('my-repo'), 'my-org-name');

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url] = callArgs;
      expect(url).to.include('name=my-org-name');
    });

    it('passes projectId parameter', async () => {
      fetchStub.resolves(mockResponse(200, { data: mockOrgData }));

      await api.takeOrgFromPool('token123', { repoName: 'my-repo', projectId: 'project-123', source: 'flag' });

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url] = callArgs;
      expect(url).to.include('project_id=project-123');
    });

    it('throws authorization error on 401', async () => {
      fetchStub.resolves(mockResponse(401));

      try {
        await api.takeOrgFromPool('invalid-token', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws noPool error on 400 with no_pool', async () => {
      fetchStub.resolves(mockResponse(400, { error: 'no_pool' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include("doesn't have a pool defined");
      }
    });

    it('throws server error on 400 with unknown error', async () => {
      fetchStub.resolves(mockResponse(400, { error: 'unknown_error' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws noActiveOrg error on 404 with no_active_org', async () => {
      fetchStub.resolves(mockResponse(404, { error: 'no_active_org' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('no active pool');
      }
    });

    it('throws server error on 404 with unknown error', async () => {
      fetchStub.resolves(mockResponse(404, { error: 'other_error' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 500', async () => {
      fetchStub.resolves(mockResponse(500));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when fetch fails', async () => {
      fetchStub.rejects(new TypeError('fetch failed'));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
      }
    });
  });

  describe('terminateOrg', () => {
    it('resolves on success', async () => {
      fetchStub.resolves(mockResponse(200));

      await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url, options] = callArgs;
      expect(url).to.include('/scratch_orgs/org-id/terminate');
      expect(url).to.include('repo_name=my-repo');
      expect(options.method).to.equal('POST');
    });

    it('passes projectId parameter', async () => {
      fetchStub.resolves(mockResponse(200));

      await api.terminateOrg('token123', { repoName: 'my-repo', projectId: 'project-123', source: 'flag' }, 'org-id');

      const callArgs = fetchStub.firstCall.args as [string, RequestInit];
      const [url] = callArgs;
      expect(url).to.include('project_id=project-123');
    });

    it('throws orgNotFoundOnHutte error on 404', async () => {
      fetchStub.resolves(mockResponse(404));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'nonexistent-org');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not find the scratch org on Hutte');
      }
    });

    it('throws authorization error on 401', async () => {
      fetchStub.resolves(mockResponse(401));

      try {
        await api.terminateOrg('invalid-token', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws server error on 500', async () => {
      fetchStub.resolves(mockResponse(500));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 503', async () => {
      fetchStub.resolves(mockResponse(503));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when fetch fails', async () => {
      fetchStub.rejects(new TypeError('fetch failed'));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
      }
    });
  });
});
