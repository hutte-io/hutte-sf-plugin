import { expect, test } from '@salesforce/command/lib/test';
import Terminate from '../../../src/commands/hutte/org/terminate';
import * as api from '../../../src/api';
import * as common from '../../../src/common';
import * as config from '../../../src/config';
import * as keychain from '../../../src/keychain';
import cross_spawn from 'cross-spawn';

describe('hutte:org:terminate', async () => {
    Terminate.requiresProject = false;

    initTest()
        .command(['hutte:org:terminate'])
        .it('terminate scratch org happy path', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.be.eql('');
        });

    initTest()
        // @Note: This stubs the API Call to Hutte API to terminate the org
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 404
            }
        }))
        .command(['hutte:org:terminate'])
        .it('fails when the scratch org cannot be found in Hutte', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('ERROR running hutte:org:terminate:  Could not find the scratch org on hutte. Are you sure you are in the correct project?');
        });

    initTest()
        // @Note: This stubs the API Call to Hutte API to terminate the org
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 500
            }
        }))
        .command(['hutte:org:terminate'])
        .it('fails when Hutte API returns an error response', async ctx => {
            expect(ctx.stdout).to.be.eql('');
            expect(ctx.stderr).to.contains('ERROR running hutte:org:terminate:  Request to hutte failed 500 undefined');
        });

});

function initTest() {
    return test
        .withConnectionRequest(() => Promise.resolve({}))
        .stdout()
        .stderr()
        .stub(keychain, 'storeUserApiToken', () => Promise.resolve())
        .stub(config, 'storeUserInfo', () => Promise.resolve())
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
        .stub(common, 'logoutFromDefault', () => Promise.resolve())
        .stub(common, 'getDefaultOrgInfo', () => Promise.resolve({
            id: 'mockOrgId'
        }))
        .stub(config, 'getCurrentUserInfo', () => Promise.resolve({
            email: 'mockUser@hutte.io',
            userId: '123467890-1234567890'
        }))
        // @Note: This stubs the API Call to Hutte API to terminate the org
        .stub(api, 'promiseRequest', () => Promise.resolve({
            response: {
                statusCode: 200
            }
        }))
  }
