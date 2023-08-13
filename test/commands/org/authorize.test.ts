import { expect, test } from '@salesforce/command/lib/test';
import Authorize from '../../../src/commands/hutte/org/authorize';
import * as api from '../../../src/api';
import * as common from '../../../src/common';
import * as config from '../../../src/config';
import * as keychain from '../../../src/keychain';
import cross_spawn from 'cross-spawn';

describe('hutte:org:authorize', async () => {
    Authorize.requiresProject = false;

    initTest()
        .command(['hutte:org:authorize'])
        .it('authorize happy path', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.be.eql('');
        });

    initTest()
        .stub(cross_spawn, 'sync', (command: string, args: string[]) => {
            if (command == 'git') {
                return { 
                    status: 0,
                    stdout: 'https://github.com/mock-org/mock-repo.git\n'
                }
            } else if (command  == 'sfdx') {
                return {
                    status: 1
                }
            }
        })
        .command(['hutte:org:authorize'])
        .it('authorize fails on sfdx error', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('ERROR running hutte:org:authorize:  The sfdx login failed.');
        });

    initTest()
        .stub(cross_spawn, 'sync', (command: string, args: string[]) => {
            if (command == 'git') {
                return { 
                    status: 1
                }
            } else if (command  == 'sfdx') {
                return {
                    status: 0
                }
            }
        })
        .command(['hutte:org:authorize'])
        .it('authorize fails on unstaged changes', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('ERROR running hutte:org:authorize:  You have unstaged changes. Please commit or stash them before proceeding.');
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
        .stub(config, 'getCurrentUserInfo', () => Promise.resolve({
            email: 'mockUser@hutte.io',
            userId: '123467890-1234567890'
        }))
        // @Note: This stubs the API Call to Hutte API to get the Hutte authenticated orgs information
        .stub(api, 'promiseRequest', () => Promise.resolve({
            body: {
                data: [mockReceivedOrg]
            }
        }))
        .stub(common, 'flagAsScratchOrg', () => Promise.resolve(mockParsedOrg))
        .stub(keychain, 'getUserApiToken', () => Promise.resolve('mockPassword'))
        .stub(common, 'devHubSfdxLogin', () => Promise.resolve(mockParsedOrg))
  }
