import { getPassword, setPassword } from 'keytar';

const SERVICE = 'hutte-io';

function getUserApiToken(params: { userId: string }): Promise<string> {
  return getPassword(SERVICE, params.userId);
}

function storeUserApiToken(params: { userId: string; apiToken: string }) {
  setPassword(SERVICE, params.userId, params.apiToken).catch(e => {
    process.exit();
  });
}

export { getUserApiToken, storeUserApiToken };
