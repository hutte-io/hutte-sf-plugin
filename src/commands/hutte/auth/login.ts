import { flags, SfdxCommand } from '@salesforce/command';

import inquirer from 'inquirer';

import { login } from '../../../api';
import { storeUserInfo } from '../../../config';
import { storeUserApiToken } from '../../../keychain';

export default class Login extends SfdxCommand {
  public static description = `authorize your hutte-io account

Known issue:

> security: SecKeychainItemCreateFromContent (<default>): The specified item already exists in the keychain.

Reauthorizing doesn't work at the moment. Please remove the 'hutte-io' item manually from the keychain of your OS and try again.`;

  public static examples = [
    `$ sfdx hutte:auth:login
? Email: john.doe@example.com
? Password: [hidden]`,
  ];

  protected static flagsConfig = {
    email: flags.string({
      char: 'e',
      description: 'the email address of your account on hutte.io',
    }),
    password: flags.string({
      char: 'p',
      description: 'the password of your account on hutte.io',
    }),
  };

  protected static requiresProject = false;

  public async run(): Promise<void> {
    const email =
      this.flags.email ||
      (
        await inquirer.prompt([
          { name: 'email', type: 'input', message: 'Email:' },
        ])
      ).email;
    const password =
      this.flags.password ||
      (
        await inquirer.prompt([
          { name: 'password', type: 'password', message: 'Password:' },
        ])
      ).password;
    login(email, password)
      .then((data) => this.store({ ...data, email }))
      .catch((error) => console.log(error));
  }

  private store(params: {
    email: string;
    userId: string;
    apiToken: string;
  }): void {
    storeUserApiToken(params);
    storeUserInfo(params);
  }
}
