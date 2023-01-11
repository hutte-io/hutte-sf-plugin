import { SfdxError } from '@salesforce/core';
import { retrieveKeychain } from '@salesforce/core/lib/keyChain';
import { platform } from 'os';

const SERVICE = 'hutte-io';

async function getUserApiToken(params: { userId: string }): Promise<string> {
  const keychain = await retrieveKeychain(platform());
  const password = await new Promise<string>((resolve, reject) => {
    keychain.getPassword(
      { service: SERVICE, account: params.userId },
      (err, password) => {
        if (err) {
          reject(err);
        } else {
          resolve(password);
        }
      },
    );
  });
  return password;
}

async function storeUserApiToken(params: { userId: string; apiToken: string }) {
  const keychain = await retrieveKeychain(platform());
  await new Promise<void>((resolve, reject) => {
    keychain.setPassword(
      {
        service: SERVICE,
        account: params.userId,
        password: params.apiToken,
      },
      (err, password?) => {
        if (err) {
          if (/SecKeychainItemCreateFromContent/.test(err.message)) {
            return reject(
              new SfdxError(
                'Could not overwrite existing credential.',
                undefined,
                [
                  "Please remove the 'hutte-io' item manually from the keychain of your OS and try again.",
                ],
                1,
                err,
              ),
            );
          }
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
}

export { getUserApiToken, storeUserApiToken };
