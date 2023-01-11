import { flags, SfdxCommand } from '@salesforce/command';

import inquirer from 'inquirer';

import { login } from '../../../api';
import { storeUserInfo } from '../../../config';
import { storeUserApiToken } from '../../../keychain';

export default class Login extends SfdxCommand {
  public static description = 'authorize your hutte-io account';

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
    const data = await login(email, password);
    await this.store({...data, email});
  }

  private async store(params: {
    email: string;
    userId: string;
    apiToken: string;
  }): Promise<void> {
    await storeUserApiToken(params);
    await storeUserInfo(params);
  }
}
