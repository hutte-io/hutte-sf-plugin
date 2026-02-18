import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { password as passwordPrompt, input as inputPrompt } from '@inquirer/prompts';
import api from '../../../api.js';
import config from '../../../config.js';
import keychain from '../../../keychain.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('hutte', 'hutte.auth.login');

type LoginResult = {
  userId: string;
};

export class Login extends SfCommand<LoginResult> {
  public static readonly summary = messages.getMessage('summary');

  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    email: Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.email.summary'),
    }),
    password: Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.password.summary'),
    }),
  };

  public async run(): Promise<LoginResult> {
    const { flags } = await this.parse(Login);
    const email = flags.email ?? (await inputPrompt({ message: messages.getMessage('prompt.email') }));
    const password = flags.password ?? (await passwordPrompt({ message: messages.getMessage('prompt.password') }));
    const data = await api.login(email, password);
    await storeCredentials({ ...data, email });
    return {
      userId: data.userId,
    };
  }
}

async function storeCredentials(params: { email: string; userId: string; apiToken: string }): Promise<void> {
  await keychain.storeUserApiToken(params);
  await config.storeUserInfo(params);
}
