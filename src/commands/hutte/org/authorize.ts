import { SfdxCommand } from '@salesforce/command';

import { execSync, spawn } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { Repository } from 'nodegit';
import { homedir } from 'os';
import { join as joinPath } from 'path';
import { keyInSelect } from 'readline-sync';
import { parse as parseUrl } from 'url';

import { getScratchOrgs, ScratchOrg } from '../../../api';

export default class Login extends SfdxCommand {
  public static description = 'authorize a scratch org from hutte.io';

  protected static requiresProject = true;

  public async run(): Promise<void> {
    return Repository.open(process.cwd())
      .then(repo => repo.getRemote('origin'))
      .then(remote => this.extractGithubRepoName(remote.url()))
      .then(repoName => getScratchOrgs(repoName))
      .then(scratchOrgs => this.chooseScratchOrg(scratchOrgs))
      .then(scratchOrg => this.sfdxLogin(scratchOrg))
      .then(scratchOrg => this.flagAsScratchOrg(scratchOrg))
      .then(scratchOrg => this.checkoutGitBranch(scratchOrg))
      .then(scratchOrg => this.sfdxPull(scratchOrg))
      .then(scratchOrg => this.markFilesAsUnchanged(scratchOrg));
  }

  private sfdxLogin(org: ScratchOrg): Promise<ScratchOrg> {
    const AUTH_URL_FILE = 'tmp_hutte_login';

    return new Promise((resolve, reject) => {
      writeFileSync(AUTH_URL_FILE, org.sfdxAuthUrl);
      const child = spawn('sfdx', [
        'force:auth:sfdxurl:store',
        '-f',
        AUTH_URL_FILE,
        '-a',
        `hutte-${org.slug}`,
        '--setdefaultusername',
      ]);

      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);

      child.on('close', code => {
        unlinkSync(AUTH_URL_FILE);

        if (code === 0) {
          resolve(org);
        } else {
          reject('The sfdx login failed.');
        }
      });
    });
  }

  private flagAsScratchOrg(org: ScratchOrg): Promise<ScratchOrg> {
    const orgInfo = JSON.parse(
      execSync('sfdx force:org:display --json').toString(),
    );
    const configFile = joinPath(
      homedir(),
      '.sfdx',
      `${orgInfo.result.username}.json`,
    );

    const config = JSON.parse(readFileSync(configFile).toString());

    writeFileSync(
      configFile,
      JSON.stringify({ ...config, devHubUsername: 'hutte.io' }),
    );

    return Promise.resolve(org);
  }

  private sfdxPull(org: ScratchOrg): Promise<ScratchOrg> {
    execSync('sfdx force:source:pull');
    return Promise.resolve(org);
  }

  private markFilesAsUnchanged(org: ScratchOrg): Promise<void> {
    const orgInfo = JSON.parse(
      execSync('sfdx force:org:display --json').toString(),
    );
    const configFile = joinPath(
      process.cwd(),
      '.sfdx',
      'orgs',
      orgInfo.result.username,
      'sourcePathInfos.json',
    );

    const config = JSON.parse(readFileSync(configFile).toString()).map(row => [
      row[0],
      { ...row[1], state: 'u' },
    ]);

    writeFileSync(configFile, JSON.stringify(config, null, 4));

    return Promise.resolve();
  }

  private chooseScratchOrg(orgs: ScratchOrg[]): Promise<ScratchOrg> {
    if (orgs.length === 1) {
      return Promise.resolve(orgs[0]);
    }

    const index = keyInSelect(orgs.map(org => org.name), 'Which scratch org?', {
      cancel: false,
    });

    return Promise.resolve(orgs[index]);
  }

  private checkoutGitBranch(org: ScratchOrg): Promise<ScratchOrg> {
    execSync(`git fetch origin && git checkout ${org.branchName}`);
    return Promise.resolve(org);
  }

  private extractGithubRepoName(remoteUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let url = parseUrl(remoteUrl).path;

      if (url[0] === '/') {
        url = url.substr(1);
      }

      if (url.slice(-4) === '.git') {
        url = url.slice(0, -4);
      }

      resolve(url);
    });
  }
}
