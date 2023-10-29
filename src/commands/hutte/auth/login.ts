import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import inquirer from 'inquirer';
import { login } from '../../../api';
import { storeUserInfo } from '../../../config';
import { storeUserApiToken } from '../../../keychain';

type LoginResult = {
  userId: string;
};

export class Login extends SfCommand<LoginResult> {
  public static readonly summary = 'authorize your hutte-io account';

  public static readonly examples = [`$ <%= config.bin %> <%= command.id %> --email john.doe@example.org`];

  public static readonly flags = {
    email: Flags.string({
      char: 'e',
      summary: 'the email address of your account on hutte.io',
    }),
    password: Flags.string({
      char: 'p',
      summary: 'the password of your account on hutte.io',
    }),
  };

  public async run(): Promise<LoginResult> {
    const { flags } = await this.parse(Login);
    const email = flags.email ?? (await inquirer.prompt([{ name: 'email', type: 'input', message: 'Email:' }])).email;
    const password =
      flags.password ??
      (await inquirer.prompt([{ name: 'password', type: 'password', message: 'Password:' }])).password;
    const data = await login(email, password);
    await this.store({ ...data, email });
    return {
      userId: data.userId,
    };
  }

  private async store(params: { email: string; userId: string; apiToken: string }): Promise<void> {
    await storeUserApiToken(params);
    await storeUserInfo(params);
  }
}
