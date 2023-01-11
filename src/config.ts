import { promises, readFileSync } from 'fs';
import { safeDump, safeLoad } from 'js-yaml';
import { homedir } from 'os';
import { join as joinPath } from 'path';

const CONFIG_FILE_DIR = joinPath(homedir(), '.hutte');
const CONFIG_FILE_PATH = joinPath(CONFIG_FILE_DIR, 'config.yml');

interface IUserInfo {
  email: string;
  userId: string;
}

function storeUserInfo(params: IUserInfo) {
  promises
    .mkdir(CONFIG_FILE_DIR, { recursive: true })
    .then(() => {
      return promises.writeFile(
        CONFIG_FILE_PATH,
        safeDump({ current_user: { id: params.userId, email: params.email } }),
      );
    })
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
}

function getCurrentUserInfo(): Promise<IUserInfo> {
  return new Promise<IUserInfo>((resolve, reject) => {
    try {
      const configFile = readFileSync(CONFIG_FILE_PATH);
      const config = safeLoad(configFile.toString()) as {
        current_user: {
          email: string;
          id: string;
        };
      };
      resolve({
        email: config.current_user.email,
        userId: config.current_user.id,
      });
    } catch {
      reject(
        'You need to authorize the client before. Run `$ sfdx hutte:auth:login -h` for more information.',
      );
    }
  });
}

export { getCurrentUserInfo, storeUserInfo };
