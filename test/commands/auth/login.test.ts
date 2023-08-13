import { expect, test } from '@salesforce/command/lib/test';
import Login from '../../../src/commands/hutte/auth/login';
import * as api from '../../../src/api';
import * as keychain from '../../../src/keychain';
import * as config from '../../../src/config';

describe('hutte:auth:login', async () => {
    Login.requiresProject = false;

    initTest()
        .stub(api, 'login', () => Promise.resolve())
        .command(['hutte:auth:login', '--email', 'test@email.com', '--password', 'mockPassword'])
        .it('login happy path', async ctx => {
            expect(ctx.stdout).to.be.eql('');
        });

    initTest()
        .stub(api, 'login', () => Promise.reject('Invalid credentials'))
        .command(['hutte:auth:login', '--email', 'test@email.com', '--password', 'mockPassword'])
        .it('login fails when credentials are incorrect', async ctx => {
            expect(ctx.stdout).to.contain('Invalid credentials');
        });
    
});

function initTest() {
    return test
        .withConnectionRequest(() => Promise.resolve({}))
        .stdout()
        .stderr()
        .stub(keychain, 'storeUserApiToken', () => Promise.resolve())
        .stub(config, 'storeUserInfo', () => Promise.resolve())
  }
