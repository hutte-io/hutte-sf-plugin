import { promises, readFileSync } from 'fs';
import { safeDump, safeLoad } from 'js-yaml';
import { homedir } from 'os';
import { join as joinPath } from 'path';

const CONFIG_FILE_DIR = joinPath(homedir(), '.hutte');
const CONFIG_FILE_PATH = joinPath(CONFIG_FILE_DIR, 'config.yml');

interface UserInfo {
  email: string;
  userId: string;
}

function storeUserInfo(params: UserInfo) {
  promises
    .mkdir(CONFIG_FILE_DIR, { recursive: true, mode: 0o644 })
    .then(() => {
      return promises.writeFile(
        CONFIG_FILE_PATH,
        safeDump({ current_user: { id: params.userId, email: params.email } }),
      );
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

function getCurrentUserInfo(): Promise<UserInfo> {
  return new Promise<UserInfo>((resolve, reject) => {
    try {
      const configFile = readFileSync(CONFIG_FILE_PATH);
      const config = safeLoad(configFile.toString());
      resolve({
        userId: config.current_user.id,
        email: config.current_user.email,
      });
    } catch {
      reject(
        'You need to authorize the client before. Run `$ sfdx hutte:auth:login -h` for more information.',
      );
    }
  });
  return;
}

export { getCurrentUserInfo, storeUserInfo };
