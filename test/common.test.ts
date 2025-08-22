import { expect } from 'chai';
import { describe, it } from 'mocha';
import common from '../src/common.js';

describe('common', () => {
  describe('retryWithTimeout', () => {
    it('should succeed the first time with timeout 0s', async () => {
      let i = 0;
      const func = async () => {
        i++;
        return 'success';
      };
      const res = await common.retryWithTimeout(func, (e) => e instanceof Error && /retry/.test(e.message));
      expect(res).to.equal('success');
      expect(i).to.equal(1);
    });

    it('should succeed the first time with timeout 5s', async () => {
      let i = 0;
      const func = async () => {
        i++;
        return 'success';
      };
      const res = await common.retryWithTimeout(func, (e) => e instanceof Error && /retry/.test(e.message), 5, 1);
      expect(res).to.equal('success');
      expect(i).to.equal(1);
    });

    it('should succeed second attempt with timeout 2s', async () => {
      let i = 0;
      const func = async () => {
        i++;
        if (i <= 1) {
          throw new Error('please retry again');
        }
        return 'success';
      };
      const res = await common.retryWithTimeout(func, (e) => e instanceof Error && /retry/.test(e.message), 2, 1);
      expect(res).to.equal('success');
      expect(i).to.equal(2);
    });

    it('should fail immediately for non-retryable error', async () => {
      let i = 0;
      const func = async () => {
        i++;
        throw new Error('no no no');
      };
      let err;
      try {
        await common.retryWithTimeout(func, (e) => e instanceof Error && /retry/.test(e.message), 5, 1);
      } catch (e) {
        err = e;
      }
      expect(err).to.match(/no no no/);
      expect(i).to.equal(1);
    });

    it('should fail all attempts with timeout 2s', async () => {
      let i = 0;
      const func = async () => {
        i++;
        throw new Error('please retry again');
      };
      let err;
      try {
        await common.retryWithTimeout(func, (e) => e instanceof Error && /retry/.test(e.message), 2, 1);
      } catch (e) {
        err = e;
      }
      expect(err).to.match(/please retry again/);
      expect(i).to.equal(2);
    });
  });

  describe('extractGithubRepoName', () => {
    it('should parse a GitHub repo URL', () => {
      expect(common.extractGithubRepoName('https://github.com/orgname/reponame.git')).to.deep.equal('orgname/reponame');
      expect(common.extractGithubRepoName('git@github.com:orgname/reponame.git')).to.deep.equal('orgname/reponame');
    });
    it('should parse a Bitbucket Server repo URL', () => {
      expect(common.extractGithubRepoName('https://git.example.org/scm/orgname/reponame.git')).to.deep.equal(
        'orgname/reponame',
      );
      expect(common.extractGithubRepoName('ssh://git@git.example.org/orgname/reponame.git')).to.deep.equal(
        'orgname/reponame',
      );
    });
  });
});
