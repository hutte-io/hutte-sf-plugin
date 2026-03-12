import got, { type Got } from 'got';
import { HttpsProxyAgent } from 'https-proxy-agent';

const API_BASE_URL = 'https://api.hutte.io/cli_api';
const API_HOST = 'api.hutte.io';

let client: Got | undefined;

function getProxyUrl(): string | undefined {
  return process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY ?? process.env.http_proxy;
}

function isProxyBypassed(noProxy: string): boolean {
  const entries = noProxy.split(',').map((e) => e.trim());
  for (const entry of entries) {
    if (entry === '*') return true;
    if (entry === API_HOST) return true;
    if (entry.startsWith('.') && API_HOST.endsWith(entry)) return true;
  }
  return false;
}

function buildProxyAgent(): { https: HttpsProxyAgent<string> } | undefined {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) return undefined;

  const noProxy = process.env.NO_PROXY ?? process.env.no_proxy;
  if (noProxy && isProxyBypassed(noProxy)) return undefined;

  return { https: new HttpsProxyAgent(proxyUrl) };
}

function createHttpClient(): Got {
  return got.extend({
    prefixUrl: API_BASE_URL,
    throwHttpErrors: false,
    responseType: 'json',
    agent: buildProxyAgent(),
  });
}

export function getHttpClient(): Got {
  if (!client) {
    client = createHttpClient();
  }
  return client;
}

export function setHttpClient(c: Got): void {
  client = c;
}

export function resetHttpClient(): void {
  client = undefined;
}
