import configData from './index.json';

export interface AppConfig {
  baseUrl: string;
  port: number;
}

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  callbackURL: string;
  appName: string;
}

export interface Config {
  app: AppConfig;
  github: GitHubConfig;
}

export const config: Config = configData;
