import { expect, test } from '@salesforce/command/lib/test';
import Take from '../../../src/commands/hutte/pool/take';
import * as api from '../../../src/api';
import * as common from '../../../src/common';
import * as keychain from '../../../src/keychain';
import * as config from '../../../src/config';
import cross_spawn from 'cross-spawn';

describe('hutte:pool:take', async () => {
    Take.requiresProject = false;

    initTest()
        .command(['hutte:pool:take', '--name', 'mockOrg', '--timeout', '60', '--wait'])
        .it('take from pool happy path', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.be.eql('');
        });

    initTest()
        // @Note: This stubs the API Call to Hutte API to take an org from the pool
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 500
            },
            body: {
                error: 'no_pool'
            }
        }))
        .command(['hutte:pool:take', '--name', 'mockOrg'])
        .it('fails when there is not a pool in the project', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('This project doesn\'t have a pool defined. Setup a pool with at least one organization and try again');
        });

    initTest()
        // @Note: This stubs the API Call to Hutte API to take an org from the pool
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 500
            },
            body: {
                error: 'no_active_org'
            }
        }))
        .command(['hutte:pool:take', '--name', 'mockOrg'])
        .it('fails when there is not an active org at the pool', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('There is no active pool at the moment, try again later.');
        });

});

function initTest() {
    const mockReceivedOrg: api.IScratchOrgResponse = {
        "id": "mockId",
        "branch_name": "mockBranch1",
        "commit_sha": "1234567890",
        "devhub_id": "00D7Q000005YnXXXXX",
        "devhub_sfdx_auth_url": "force://mockDevHubUrl",
        "name": "Test Playground 1",
        "project_name": "Test Playground 1",
        "sfdx_auth_url": "force://mockUrl1",
        "revision_number": "0",
        "slug": "mock",
        "state": "active",
        "salesforce_id": "mockId",
        "remaining_days": '1',
        "project_id": "mockProjectId",
        "initial_branch_name": "master",
        "gid": "mockGlobalId",
        "domain": "CS162",
        "created_at": "2023-05-31T10:11:57.135Z",
        "created_by": "Test User",
        "pool": false
    };

    const mockParsedOrg: api.IScratchOrg = {
        "id": "mockId",
        "branchName": "mockBranch1",
        "commitSha": '1234567890',
        "devhubId": "00D7Q000005YnXXXXX",
        "devhubSfdxAuthUrl": "force://mockDevHubUrl",
        "name": "Test Playground 1",
        "projectName": "Test Playground 1",
        "sfdxAuthUrl": "force://mockUrl1",
        "revisionNumber": "0",
        "slug": "mock",
        "state": "active",
        "salesforceId": "mockId",
        "remainingDays": 1,
        "projectId": "mockProjectId",
        "initialBranchName": "master",
        "globalId": "mockGlobalId",
        "domain": "CS162",
        "createdAt": "2023-05-31T10:11:57.135Z",
        "createdBy": "Test User",
        "pool": false
    }

    return test
        .withConnectionRequest(() => Promise.resolve({}))
        .stdout()
        .stderr()
        .stub(config, 'getCurrentUserInfo', () => Promise.resolve({
            email: 'mockUser@hutte.io',
            userId: '123467890-1234567890'
        }))
        .stub(keychain, 'getUserApiToken', () => Promise.resolve('mockPassword'))
        .stub(cross_spawn, 'sync', (command: string, args: string[]) => {
            if (command == 'git') {
                return { 
                    status: 0,
                    stdout: 'https://github.com/mock-org/mock-repo.git\n'
                }
            } else if (command  == 'sfdx') {
                return {
                    status: 0
                }
            }
        })
        // @Note: This stubs the API Call to Hutte API to take an org from the pool
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 200
            },
            body: {
                data: mockReceivedOrg
            }
        }))
        .stub(common, 'devHubSfdxLogin', () => Promise.resolve(mockParsedOrg))
        .stub(common, 'flagAsScratchOrg', () => Promise.resolve(mockParsedOrg))
  }
