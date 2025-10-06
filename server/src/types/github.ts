import { Octokit } from '@octokit/rest';

export interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  default_branch: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string | null;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: 'base64' | 'utf-8' | 'binary';
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'all';
  created_at: string;
  updated_at: string;
  html_url: string;
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  user: GitHubUser;
  mergeable: boolean | null;
  mergeable_state: string;
  merged: boolean;
}

export interface GitHubWebhookConfig {
  url: string;
  contentType: 'json' | 'form';
  secret?: string;
  events: string[];
  active?: boolean;
}

export interface GitHubServiceOptions {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  appName: string;
  baseUrl: string;
}

export interface GitHubFileContent {
  content: string;
  encoding: 'base64' | 'utf-8' | 'binary';
  sha: string;
  size: number;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

export interface GitHubCommitOptions {
  message: string;
  content: string;
  sha?: string;
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
}

export interface GitHubCreatePROptions {
  title: string;
  body: string;
  head: string;
  base: string;
  maintainer_can_modify?: boolean;
  draft?: boolean;
}

export interface GitHubMergeOptions {
  commit_title?: string;
  commit_message?: string;
  merge_method?: 'merge' | 'squash' | 'rebase';
}

export interface GitHubConflict {
  reason: string;
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message: string;
  }>;
}

export class GitHubError extends Error {
  status: number;
  headers: Record<string, string>;
  request: any;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message: string;
  }>;

  constructor(
    message: string,
    status: number,
    headers: Record<string, string> = {},
    request: any = null,
    documentation_url?: string,
    errors?: any[]
  ) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.headers = headers;
    this.request = request;
    this.documentation_url = documentation_url;
    this.errors = errors;
  }
}

export type GitHubClient = InstanceType<typeof Octokit>;
