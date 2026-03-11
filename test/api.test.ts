/* eslint-disable camelcase */
import { expect } from 'chai';
import sinon, { type SinonStub } from 'sinon';
import { SfError } from '@salesforce/core';
import { type Got, RequestError } from 'got';
import api, { type IScratchOrgResponse } from '../src/api.js';
import { setHttpClient, resetHttpClient } from '../src/http-client.js';
import { type ResolvedProject } from '../src/types.js';

const gitProject = (repoName: string): ResolvedProject => ({ repoName, source: 'git' });

describe('api', () => {
  let clientStub: SinonStub;

  beforeEach(() => {
    clientStub = sinon.stub();
    setHttpClient(clientStub as unknown as Got);
  });

  afterEach(() => {
    resetHttpClient();
    sinon.restore();
  });

  const mockResponse = (statusCode: number, body: unknown = {}): { statusCode: number; body: unknown } => ({
    statusCode,
    body,
  });

  describe('login', () => {
    it('returns userId and apiToken on success', async () => {
      clientStub.resolves(
        mockResponse(200, {
          data: { api_token: 'token123', user_id: 'user456' },
        })
      );

      const result = await api.login('test@example.com', 'password123');

      expect(result.apiToken).to.equal('token123');
      expect(result.userId).to.equal('user456');
      expect(clientStub.calledOnce).to.equal(true);

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('api_tokens');
      expect(options.method).to.equal('post');
      expect(options.json).to.deep.equal({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.login('test@example.com', 'wrongpassword');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws authorization error on 400', async () => {
      clientStub.resolves(mockResponse(400));

      try {
        await api.login('test@example.com', 'password');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws network error when request fails', async () => {
      const networkError = new RequestError('getaddrinfo ENOTFOUND api.hutte.io', {}, undefined as never);
      clientStub.rejects(networkError);

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
      web_url: 'https://app.hutte.io/scratch-orgs/gid1',
    };

    it('returns mapped scratch orgs on success', async () => {
      clientStub.resolves(mockResponse(200, { data: [mockOrgData] }));

      const result = await api.getScratchOrgs('token123', gitProject('my-repo'));

      expect(result).to.have.lengthOf(1);
      expect(result[0].id).to.equal('org1');
      expect(result[0].branchName).to.equal('feature-1');
      expect(result[0].orgName).to.equal('My Org');
      expect(result[0].remainingDays).to.equal(7);

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('scratch_orgs');
      expect((options.searchParams as Record<string, string>).repo_name).to.equal('my-repo');
    });

    it('passes includeAll parameter', async () => {
      clientStub.resolves(mockResponse(200, { data: [] }));

      await api.getScratchOrgs('token123', gitProject('my-repo'), true);

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect((options.searchParams as Record<string, string>).all).to.equal('true');
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.getScratchOrgs('invalid-token', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws server error on 500', async () => {
      clientStub.resolves(mockResponse(500));

      try {
        await api.getScratchOrgs('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 503', async () => {
      clientStub.resolves(mockResponse(503));

      try {
        await api.getScratchOrgs('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when request fails', async () => {
      clientStub.rejects(new RequestError('fetch failed', {}, undefined as never));

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
      web_url: 'https://app.hutte.io/scratch-orgs/gid2',
    };

    it('returns mapped scratch org on success', async () => {
      clientStub.resolves(mockResponse(200, { data: mockOrgData }));

      const result = await api.takeOrgFromPool('token123', gitProject('my-repo'));

      expect(result.id).to.equal('org1');
      expect(result.orgName).to.equal('Pool Org');
      expect(result.pool).to.equal(true);

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('take_from_pool');
      expect(options.method).to.equal('post');
    });

    it('passes orgName parameter', async () => {
      clientStub.resolves(mockResponse(200, { data: mockOrgData }));

      await api.takeOrgFromPool('token123', gitProject('my-repo'), 'my-org-name');

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect((options.searchParams as Record<string, string>).name).to.equal('my-org-name');
    });

    it('passes projectId parameter', async () => {
      clientStub.resolves(mockResponse(200, { data: mockOrgData }));

      await api.takeOrgFromPool('token123', { repoName: 'my-repo', projectId: 'project-123', source: 'flag' });

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect((options.searchParams as Record<string, string>).project_id).to.equal('project-123');
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.takeOrgFromPool('invalid-token', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws noPool error on 400 with no_pool', async () => {
      clientStub.resolves(mockResponse(400, { error: 'no_pool' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include("doesn't have a pool defined");
      }
    });

    it('throws server error on 400 with unknown error', async () => {
      clientStub.resolves(mockResponse(400, { error: 'unknown_error' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws noActiveOrg error on 404 with no_active_org', async () => {
      clientStub.resolves(mockResponse(404, { error: 'no_active_org' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('no active pool');
      }
    });

    it('throws server error on 404 with unknown error', async () => {
      clientStub.resolves(mockResponse(404, { error: 'other_error' }));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 500', async () => {
      clientStub.resolves(mockResponse(500));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when request fails', async () => {
      clientStub.rejects(new RequestError('fetch failed', {}, undefined as never));

      try {
        await api.takeOrgFromPool('token123', gitProject('my-repo'));
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
      }
    });
  });

  describe('createScratchOrg', () => {
    it('creates scratch org and returns mapped result', async () => {
      const mockOrgResponse: IScratchOrgResponse = {
        id: 'new-org-1',
        branch_name: 'feature-1',
        commit_sha: 'abc123',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user@example.com',
        domain: 'CS1',
        gid: 'gid1',
        initial_branch_name: 'main',
        name: 'New Org',
        project_id: 'proj1',
        project_name: 'My Project',
        remaining_days: '7',
        revision_number: null,
        salesforce_id: 'sf1',
        sfdx_auth_url: 'force://neworg',
        slug: 'new-org',
        state: 'creating',
        pool: false,
        web_url: 'https://app.hutte.io/scratch-orgs/gid1',
      };

      clientStub.resolves(mockResponse(200, { data: mockOrgResponse }));

      const result = await api.createScratchOrg('token123', {
        project: gitProject('my-repo'),
        name: 'New Org',
      });

      expect(result.id).to.equal('new-org-1');
      expect(result.orgName).to.equal('New Org');
      expect(result.state).to.equal('creating');

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('scratch_orgs');
      expect(options.method).to.equal('post');

      const body = options.json as Record<string, unknown>;
      expect(body.repo_name).to.equal('my-repo');
      expect(body.name).to.equal('New Org');
    });

    it('passes project_id when resolved by project ID', async () => {
      clientStub.resolves(
        mockResponse(200, {
          data: {
            id: 'org1',
            branch_name: '',
            commit_sha: '',
            created_at: '',
            created_by: '',
            domain: '',
            gid: '',
            initial_branch_name: '',
            name: '',
            project_id: '',
            project_name: '',
            remaining_days: '0',
            revision_number: null,
            salesforce_id: '',
            sfdx_auth_url: '',
            slug: '',
            state: 'creating',
            pool: false,
            web_url: '',
          },
        })
      );

      await api.createScratchOrg('token123', {
        project: { repoName: 'my-repo', projectId: 'project-123', source: 'flag' },
        name: 'Test Org',
      });

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      const body = options.json as Record<string, unknown>;
      expect(body.project_id).to.equal('project-123');
      expect(body.repo_name).to.equal('my-repo');
    });

    it('passes optional fields', async () => {
      clientStub.resolves(
        mockResponse(200, {
          data: {
            id: 'org1',
            branch_name: '',
            commit_sha: '',
            created_at: '',
            created_by: '',
            domain: '',
            gid: '',
            initial_branch_name: '',
            name: '',
            project_id: '',
            project_name: '',
            remaining_days: '0',
            revision_number: null,
            salesforce_id: '',
            sfdx_auth_url: '',
            slug: '',
            state: 'creating',
            pool: false,
            web_url: '',
          },
        })
      );

      await api.createScratchOrg('token123', {
        project: gitProject('my-repo'),
        name: 'Test Org',
        initialBranchName: 'develop',
        durationDays: 14,
        branchName: 'feature/test',
        noAncestors: true,
        noNamespace: false,
        issueReference: 'JIRA-123',
        notes: 'test notes',
      });

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      const body = options.json as Record<string, unknown>;
      expect(body.initial_branch_name).to.equal('develop');
      expect(body.duration_days).to.equal(14);
      expect(body.branch_name).to.equal('feature/test');
      expect(body.no_ancestors).to.equal(true);
      expect(body.no_namespace).to.equal(false);
      expect(body.issue_reference).to.equal('JIRA-123');
      expect(body.notes).to.equal('test notes');
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.createScratchOrg('invalid-token', { project: gitProject('my-repo'), name: 'Test' });
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws bad request error on 400', async () => {
      clientStub.resolves(mockResponse(400, { error: 'Invalid config' }));

      try {
        await api.createScratchOrg('token123', { project: gitProject('my-repo'), name: 'Test' });
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Invalid config');
      }
    });

    it('throws server error on 500', async () => {
      clientStub.resolves(mockResponse(500));

      try {
        await api.createScratchOrg('token123', { project: gitProject('my-repo'), name: 'Test' });
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });
  });

  describe('getScratchOrg', () => {
    it('returns mapped scratch org on success', async () => {
      const mockOrgResponse: IScratchOrgResponse = {
        id: 'org1',
        branch_name: 'feature-1',
        commit_sha: 'abc123',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'user@example.com',
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
        web_url: 'https://app.hutte.io/scratch-orgs/gid1',
      };

      clientStub.resolves(mockResponse(200, { data: mockOrgResponse }));

      const result = await api.getScratchOrg('token123', gitProject('my-repo'), 'org1');

      expect(result.id).to.equal('org1');
      expect(result.orgName).to.equal('My Org');

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('scratch_orgs/org1');
      expect((options.searchParams as Record<string, string>).repo_name).to.equal('my-repo');
    });

    it('passes project_id parameter', async () => {
      clientStub.resolves(
        mockResponse(200, {
          data: {
            id: 'org1',
            branch_name: '',
            commit_sha: '',
            created_at: '',
            created_by: '',
            domain: '',
            gid: '',
            initial_branch_name: '',
            name: '',
            project_id: '',
            project_name: '',
            remaining_days: '0',
            revision_number: null,
            salesforce_id: '',
            sfdx_auth_url: '',
            slug: '',
            state: 'active',
            pool: false,
            web_url: '',
          },
        })
      );

      await api.getScratchOrg('token123', { repoName: 'my-repo', projectId: 'project-123', source: 'flag' }, 'org1');

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect((options.searchParams as Record<string, string>).project_id).to.equal('project-123');
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.getScratchOrg('invalid-token', gitProject('my-repo'), 'org1');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws orgNotFoundOnHutte error on 404', async () => {
      clientStub.resolves(mockResponse(404));

      try {
        await api.getScratchOrg('token123', gitProject('my-repo'), 'nonexistent');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not find the scratch org on Hutte');
      }
    });

    it('throws server error on 500', async () => {
      clientStub.resolves(mockResponse(500));

      try {
        await api.getScratchOrg('token123', gitProject('my-repo'), 'org1');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when request fails', async () => {
      clientStub.rejects(new RequestError('fetch failed', {}, undefined as never));

      try {
        await api.getScratchOrg('token123', gitProject('my-repo'), 'org1');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not connect to Hutte');
      }
    });
  });

  describe('terminateOrg', () => {
    it('resolves on success', async () => {
      clientStub.resolves(mockResponse(200));

      await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');

      const [path, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect(path).to.equal('scratch_orgs/org-id/terminate');
      expect((options.searchParams as Record<string, string>).repo_name).to.equal('my-repo');
      expect(options.method).to.equal('post');
    });

    it('passes projectId parameter', async () => {
      clientStub.resolves(mockResponse(200));

      await api.terminateOrg('token123', { repoName: 'my-repo', projectId: 'project-123', source: 'flag' }, 'org-id');

      const [, options] = clientStub.firstCall.args as [string, Record<string, unknown>];
      expect((options.searchParams as Record<string, string>).project_id).to.equal('project-123');
    });

    it('throws orgNotFoundOnHutte error on 404', async () => {
      clientStub.resolves(mockResponse(404));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'nonexistent-org');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Could not find the scratch org on Hutte');
      }
    });

    it('throws authorization error on 401', async () => {
      clientStub.resolves(mockResponse(401));

      try {
        await api.terminateOrg('invalid-token', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('authorization');
      }
    });

    it('throws server error on 500', async () => {
      clientStub.resolves(mockResponse(500));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws server error on 503', async () => {
      clientStub.resolves(mockResponse(503));

      try {
        await api.terminateOrg('token123', gitProject('my-repo'), 'org-id');
        expect.fail('should throw an error');
      } catch (e) {
        expect(e).to.be.instanceOf(SfError);
        expect((e as SfError).message).to.include('Request to Hutte failed');
      }
    });

    it('throws network error when request fails', async () => {
      clientStub.rejects(new RequestError('fetch failed', {}, undefined as never));

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
