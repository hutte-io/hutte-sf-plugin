import { getPassword } from 'keytar';
import { getConfig } from './config-new';

const SERVICE = 'hutte-io';

const REMOVAL_INSTRUCTIONS = `
You can now remove the 'hutte-io' entry from the keychain of your OS.

MacOS

- Open 'Keyhain Access.app'
- Search for 'hutte-io' of kind application password
- Right click and delete

Linux

- TBD

Windows

- TBD
`;

async function getUserApiToken(params: { userId: string }): Promise<string | null> {
  const config = await getConfig();
  const token = config.get('token', true);
  if (token) {
    return token;
  }
  // for backwards compatibility with keytar
  try {
    const tokenFromKeytar = await getPassword(SERVICE, params.userId);
    if (tokenFromKeytar) {
      console.warn(`Storing encrypted API token in new config file: ${config.getPath()}...`);
      await storeUserApiToken({ userId: params.userId, apiToken: tokenFromKeytar });
      console.warn(REMOVAL_INSTRUCTIONS);
      return tokenFromKeytar;
    }
  } catch {
    // swallow keytar errors
  }
  return null;
}

async function storeUserApiToken(params: { userId: string; apiToken: string }): Promise<void> {
  const config = await getConfig();
  config.set('token', params.apiToken);
  await config.write();
}

export { getUserApiToken, storeUserApiToken };
