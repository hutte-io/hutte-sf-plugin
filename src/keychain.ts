import { getPassword, setPassword } from 'keytar';

const SERVICE = 'hutte-io';

async function getUserApiToken(params: { userId: string }): Promise<string | null> {
  return await getPassword(SERVICE, params.userId);
}

async function storeUserApiToken(params: { userId: string; apiToken: string }): Promise<void> {
  await setPassword(SERVICE, params.userId, params.apiToken);
}

export { getUserApiToken, storeUserApiToken };
