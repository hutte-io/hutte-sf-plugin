import { promises, readFileSync } from 'fs';
import { dump, load } from 'js-yaml';
import { homedir } from 'os';
import { join as joinPath } from 'path';
import keychain from './keychain.js';

const CONFIG_FILE_DIR = joinPath(homedir(), '.hutte');
const CONFIG_FILE_PATH = joinPath(CONFIG_FILE_DIR, 'config.yml');

interface IUserInfo {
  email: string;
  userId: string;
}

async function storeUserInfo(params: IUserInfo): Promise<void> {
  await promises.mkdir(CONFIG_FILE_DIR, { recursive: true });
  await promises.writeFile(CONFIG_FILE_PATH, dump({ current_user: { id: params.userId, email: params.email } }));
}

function getCurrentUserInfo(): IUserInfo {
  try {
    const configFile = readFileSync(CONFIG_FILE_PATH);
    const config = load(configFile.toString()) as {
      current_user: {
        email: string;
        id: string;
      };
    };
    return {
      email: config.current_user.email,
      userId: config.current_user.id,
    };
  } catch {
    throw new Error('You need to authorize the client before. Run `$ sf hutte auth login -h` for more information.');
  }
}

async function getApiToken(): Promise<string> {
  const userInfo = getCurrentUserInfo();
  const apiToken = await keychain.getUserApiToken(userInfo);
  if (!apiToken) {
    throw new Error('Could not get api token from password store');
  }
  return apiToken;
}

export default {
  getApiToken,
  getCurrentUserInfo,
  storeUserInfo,
};
