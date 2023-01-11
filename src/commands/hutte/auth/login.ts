import { flags, SfdxCommand } from '@salesforce/command';

import inquirer from 'inquirer';

import { login } from '../../../api';
import { storeUserInfo } from '../../../config';
import { storeUserApiToken } from '../../../keychain';

export default class Login extends SfdxCommand {
  public static description = 'authorize your hutte-io account';

  public static examples = [
    `$ sfdx hutte:auth:login --email myEmail@example.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
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
