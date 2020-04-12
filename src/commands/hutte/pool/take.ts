import { flags, SfdxCommand } from '@salesforce/command';

import { execSync, spawn } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { Repository } from 'nodegit';
import { homedir } from 'os';
import { join as joinPath } from 'path';
import { parse as parseUrl } from 'url';

import { IScratchOrg, takeOrgFromPool } from '../../../api';

export default class Take extends SfdxCommand {
  public static description = 'take a scratch org from the pool';

  protected static requiresProject = true;

  protected static flagsConfig = {
    name: flags.string({
      char: 'n',
      description: 'the name of the org',
    }),
    'project-id': flags.string({
      char: 'p',
      description:
        'the id of the project. Useful when multiple projects use the same git repository.',
    }),
    wait: flags.boolean({
      char: 'w',
      description: 'waits until an org becomes available',
    }),
  };

  public async run(): Promise<void> {
    return this.fetchOrg()
      .then((scratchOrg) => this.processOrg(scratchOrg))
      .then(() => Promise.resolve());
  }

  private fetchOrg(): Promise<IScratchOrg> {
    return Repository.open(process.cwd())
      .then((repo) => repo.getRemote('origin'))
      .then((remote) => this.extractGithubRepoName(remote.url()))
      .then((repoName) =>
        takeOrgFromPool(repoName, this.flags['project-id'], this.flags.name),
      )
      .catch((e) => {
        const { body } = e;

        if (body && body.error) {
          if (body.error === 'no_pool') {
            console.log(
              "This project doesn't have a pool defined. Setup a pool with at least one organization and try again.",
            );
          } else if (body.error === 'no_active_org') {
            if (this.flags.wait) {
              console.log(
                'There is no active pool at the moment. Trying again in 10 seconds.',
              );
              return new Promise(() => setTimeout(() => this.run(), 10000));
            }

            console.log(
              'There is no active pool at the moment, try again later.',
            );
          }
        } else {
          console.log('Uknown error.', e);
        }

        return Promise.reject(body);
      });
  }

  private processOrg(scratchOrg: IScratchOrg): Promise<IScratchOrg> {
    return this.devHubSfdxLogin(scratchOrg)
      .then(() => this.sfdxLogin(scratchOrg))
      .then(() => this.flagAsScratchOrg(scratchOrg));
  }

  private sfdxLogin(org: IScratchOrg): Promise<IScratchOrg> {
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

      child.on('close', (code) => {
        unlinkSync(AUTH_URL_FILE);

        if (code === 0) {
          resolve(org);
        } else {
          reject('The sfdx login failed.');
        }
      });
    });
  }

  private devHubSfdxLogin(org: IScratchOrg): Promise<IScratchOrg> {
    const AUTH_URL_FILE = 'tmp_hutte_login';

    return new Promise((resolve, reject) => {
      writeFileSync(AUTH_URL_FILE, org.devhubSfdxAuthUrl);
      const child = spawn('sfdx', [
        'force:auth:sfdxurl:store',
        '-f',
        AUTH_URL_FILE,
        '-a',
        this.devHubAlias(org),
        '-d',
      ]);

      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);

      child.on('close', (code) => {
        unlinkSync(AUTH_URL_FILE);

        if (code === 0) {
          resolve(org);
        } else {
          reject('The devhub login failed.');
        }
      });
    });
  }

  private devHubAlias(org: IScratchOrg): string {
    return 'cli@hutte.io';
  }

  private flagAsScratchOrg(org: IScratchOrg): Promise<IScratchOrg> {
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
      JSON.stringify(
        { ...config, devHubUsername: this.devHubAlias(org) },
        null,
        4,
      ),
    );

    return Promise.resolve(org);
  }

  private extractGithubRepoName(remoteUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let url = parseUrl(remoteUrl).path;

      if (url[0] === '/') {
        url = url.substr(1);
      }

      if (url.indexOf(':') >= 0) {
        url = url.slice(url.indexOf(':') + 1);
      }

      if (url.slice(-4) === '.git') {
        url = url.slice(0, -4);
      }

      resolve(url);
    });
  }
}
