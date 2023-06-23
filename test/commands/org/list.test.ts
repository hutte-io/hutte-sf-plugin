import { expect, test } from '@salesforce/command/lib/test';
import * as common from '../../../src/common';
import * as api from '../../../src/api';
import List from '../../../src/commands/hutte/org/list';

describe('hutte:org:list', async () => {

    List.requiresProject = false;

    initTest()
        .command(['hutte:org:list', '--json'])
        .it('happy path, returns basic details', async ctx => {
            const output = JSON.parse(ctx.stdout);

            expect(output.result.length).to.be.eql(3);
            expect(output.result[0].name).to.be.eql('Test Playground 1');
            expect(output.result[0].projectName).to.be.eql('Test Playground 1');
            expect(output.result[0].state).to.be.eql('active');
            expect(output.result[0].sfdxAuthUrl).to.be.undefined;
        });
    
    initTest()
        .command(['hutte:org:list', '--json', '--verbose'])
        .it('when includeauth is set, returns all complete details', async ctx => {
            const output = JSON.parse(ctx.stdout);

            expect(output.result.length).to.be.eql(3);
            expect(output.result[0].name).to.be.eql('Test Playground 1');
            expect(output.result[0].devhubSfdxAuthUrl).to.be.eql('force://mockDevHubUrl');
            expect(output.result[0].sfdxAuthUrl).to.be.eql('force://mockUrl1');
            expect(output.result[0].state).to.be.eql('active');
        });
});

function initTest() {
    return test
        .withConnectionRequest(() => Promise.resolve({}))
        .stdout()
        .stderr()
        .stub(common, 'projectRepoFromOrigin', () => Promise.resolve())
        .stub(api, 'getScratchOrgs', () => Promise.resolve([
            {
              "id": "mockId",
              "branchName": "mockBranch1",
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
            },
            {
              "id": "mockId",
              "branchName": "mockBranch2",
              "devhubId": "00D7Q000005YnXXXXX",
              "devhubSfdxAuthUrl": "force://mockDevHubUrl",
              "name": "Test Playground 2",
              "projectName": "Test Playground 2",
              "sfdxAuthUrl": "force://mockUrl2",
              "revisionNumber": "0",
              "slug": "mock",
              "state": "active",
              "salesforceId": "mockId2",
              "remainingDays": 1,
              "projectId": "mockProjectId",
              "initialBranchName": "master",
              "globalId": "mockGlobalId2",
              "domain": "CS162",
              "createdAt": "2023-05-31T10:12:57.135Z",
              "createdBy": "Test User",
            },
            {
              "id": "mockId",
              "branchName": "mockBranch2",
              "devhubId": "00D7Q000005YnXXXXX",
              "devhubSfdxAuthUrl": "force://mockDevHubUrl",
              "name": "Test Playground 3",
              "projectName": "Test Playground 3",
              "sfdxAuthUrl": "force://mockUrl3",
              "revisionNumber": "0",
              "slug": "mock",
              "state": "active",
              "salesforceId": "mockId3",
              "remainingDays": 1,
              "projectId": "mockProjectId",
              "initialBranchName": "master",
              "globalId": "mockGlobalId3",
              "domain": "CS162",
              "createdAt": "2023-05-31T10:16:57.135Z",
              "createdBy": "Test User",
            }
          ]))
  }
