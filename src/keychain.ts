import { getConfig } from './config-new.js';

async function getUserApiToken(params: { userId: string }): Promise<string | null> {
  const config = await getConfig();
  return config.get('token', true);
}

async function storeUserApiToken(params: { userId: string; apiToken: string }): Promise<void> {
  const config = await getConfig();
  config.set('token', params.apiToken);
  await config.write();
}

export default { getUserApiToken, storeUserApiToken };
