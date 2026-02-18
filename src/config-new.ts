import { ConfigFile } from '@salesforce/core';

type HutteConfig = {
  // userId: string;
  // email: string;
  token: string;
};

class HutteConfigFile extends ConfigFile<ConfigFile.Options, HutteConfig> {
  protected static encryptedKeys = ['token'];
}

export async function getConfig(): Promise<HutteConfigFile> {
  return HutteConfigFile.create({
    isGlobal: true,
    stateFolder: '.hutte',
    filename: 'config.json',
  });
}
