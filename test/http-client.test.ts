/* eslint-disable no-unused-expressions, camelcase */
import { expect } from 'chai';
import { getHttpClient, resetHttpClient } from '../src/http-client.js';

describe('http-client', () => {
  const envVars = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'NO_PROXY', 'no_proxy'];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of envVars) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    resetHttpClient();
  });

  afterEach(() => {
    for (const key of envVars) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    resetHttpClient();
  });

  it('returns a got instance with correct prefixUrl', () => {
    const client = getHttpClient();
    expect(client.defaults.options.prefixUrl).to.equal('https://api.hutte.io/cli_api/');
  });

  it('returns a singleton instance', () => {
    const client1 = getHttpClient();
    const client2 = getHttpClient();
    expect(client1).to.equal(client2);
  });

  it('returns new instance after reset', () => {
    const client1 = getHttpClient();
    resetHttpClient();
    const client2 = getHttpClient();
    expect(client1).to.not.equal(client2);
  });

  it('does not configure agent when no proxy env vars are set', () => {
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });

  it('configures HttpsProxyAgent when HTTPS_PROXY is set', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.not.be.undefined;
    expect(agent.https!.constructor.name).to.equal('HttpsProxyAgent');
  });

  it('falls back to HTTP_PROXY when HTTPS_PROXY is not set', () => {
    process.env.HTTP_PROXY = 'http://proxy:3128';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.not.be.undefined;
    expect(agent.https!.constructor.name).to.equal('HttpsProxyAgent');
  });

  it('uses lowercase https_proxy', () => {
    process.env.https_proxy = 'http://proxy:8080';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.not.be.undefined;
  });

  it('uses lowercase http_proxy as fallback', () => {
    process.env.http_proxy = 'http://proxy:8080';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.not.be.undefined;
  });

  it('bypasses proxy when NO_PROXY matches exact host', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = 'api.hutte.io';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });

  it('bypasses proxy when NO_PROXY matches domain wildcard', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '.hutte.io';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });

  it('bypasses proxy when NO_PROXY is *', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = '*';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });

  it('does not bypass proxy when NO_PROXY does not match', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = 'other.example.com';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.not.be.undefined;
  });

  it('handles comma-separated NO_PROXY list', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.NO_PROXY = 'example.com, api.hutte.io, other.com';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });

  it('uses lowercase no_proxy', () => {
    process.env.HTTPS_PROXY = 'http://proxy:8080';
    process.env.no_proxy = 'api.hutte.io';
    const client = getHttpClient();
    const agent = client.defaults.options.agent;
    expect(agent.https).to.be.undefined;
  });
});
