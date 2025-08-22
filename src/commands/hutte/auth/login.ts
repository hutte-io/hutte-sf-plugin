import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { password as passwordPrompt, input as inputPrompt } from '@inquirer/prompts';
import api from '../../../api.js';
import config from '../../../config.js';
import keychain from '../../../keychain.js';

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
    const email = flags.email ?? (await inputPrompt({  message: 'Email:' }));
    const password = flags.password ?? (await passwordPrompt({ message: 'Password:' }));
    const data = await api.login(email, password);
    await this.store({ ...data, email });
    return {
      userId: data.userId,
    };
  }

  private async store(params: { email: string; userId: string; apiToken: string }): Promise<void> {
    await keychain.storeUserApiToken(params);
    await config.storeUserInfo(params);
  }
}
