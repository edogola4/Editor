import { Octokit } from '@octokit/rest';

export type GitHubSearchType = 'repositories' | 'code' | 'issues' | 'users';

export interface GitHubSearchParams {
  q: string;
  type: GitHubSearchType;
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface GitHubSearchResult {
  type: GitHubSearchType;
  items: any[];
  total_count: number;
  incomplete_results: boolean;
}

export interface GitHubGist {
  id: string;
  description: string | null;
  public: boolean;
  files: Record<string, {
    filename: string;
    type: string;
    language: string | null;
    raw_url: string;
    size: number;
  }>;
  html_url: string;
  created_at: string;
  updated_at: string;
  owner: GitHubUser;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
    default: boolean;
  }>;
  user: GitHubUser;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  repository: GitHubRepository;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
  comments: number;
  html_url: string;
  locked: boolean;
  active_lock_reason?: string | null;
}

export interface GitHubSearchCodeResult {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: GitHubRepository;
  score: number;
  text_matches?: Array<{
    object_url: string;
    object_type: string;
    property: string;
    fragment: string;
    matches: Array<{
      text: string;
      indices: [number, number];
    }>;
  }>;
}

export interface GitHubSearchRepositoryResult {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  score: number;
}

export interface GitHubSearchUserResult {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  score: number;
  site_admin: boolean;
}

export interface GitHubSearchIssueResult extends GitHubIssue {
  score: number;
  text_matches?: Array<{
    object_url: string;
    object_type: string;
    property: string;
    fragment: string;
    matches: Array<{
      text: string;
      indices: [number, number];
    }>;
  }>;
}

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

export interface GitHubClient extends Octokit {
  // Search methods
  search: {
    repos: (params: { 
      q: string; 
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
      order?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: { 
        items: GitHubSearchRepositoryResult[]; 
        total_count: number; 
        incomplete_results: boolean;
      };
    }>;
    
    code: (params: { 
      q: string; 
      sort?: 'indexed';
      order?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: { 
        items: GitHubSearchCodeResult[]; 
        total_count: number; 
        incomplete_results: boolean;
      };
    }>;
    
    issuesAndPullRequests: (params: { 
      q: string; 
      sort?: 'comments' | 'reactions' | 'reactions-+1' | 'reactions--1' | 'reactions-smile' | 'reactions-thinking_face' | 'reactions-heart' | 'reactions-tada' | 'interactions' | 'created' | 'updated';
      order?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: { 
        items: (GitHubIssue | GitHubPullRequest)[]; 
        total_count: number; 
        incomplete_results: boolean;
      };
    }>;
    
    users: (params: { 
      q: string; 
      sort?: 'followers' | 'repositories' | 'joined';
      order?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: { 
        items: GitHubSearchUserResult[]; 
        total_count: number; 
        incomplete_results: boolean;
      };
    }>;
  };
  
  // Gists methods
  gists: {
    list: (params: { 
      since?: string;
      page?: number; 
      per_page?: number; 
    }) => Promise<{ 
      data: GitHubGist[];
      headers: Record<string, string>;
    }>;
  };
  
  // Issues methods
  issues: {
    listForRepo: (params: { 
      owner: string; 
      repo: string; 
      milestone?: string | number;
      state?: 'open' | 'closed' | 'all';
      assignee?: string;
      creator?: string;
      mentioned?: string;
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      since?: string;
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: GitHubIssue[];
      headers: Record<string, string>;
    }>;
  };
  
  // Pull Requests methods
  pulls: {
    list: (params: { 
      owner: string; 
      repo: string;
      state?: 'open' | 'closed' | 'all';
      head?: string;
      base?: string;
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      page?: number;
      per_page?: number;
    }) => Promise<{ 
      data: GitHubPullRequest[];
      headers: Record<string, string>;
    }>;
  };
  
  // Repository methods
  repos: {
    listBranches: (params: { 
      owner: string; 
      repo: string; 
      protected?: boolean;
      page?: number; 
      per_page?: number;
    }) => Promise<{ 
      data: GitHubBranch[];
      headers: Record<string, string>;
    }>;
  };
  
  // Create methods
  create: {
    gist: (params: { 
      description: string;
      public: boolean;
      files: Record<string, { 
        content: string;
        filename?: string;
      }>;
    }) => Promise<{ 
      data: GitHubGist;
      headers: Record<string, string>;
    }>;
    
    issue: (params: { 
      owner: string;
      repo: string;
      title: string;
      body: string;
      assignee?: string;
      milestone?: string | number;
      labels?: string[];
      state?: 'open' | 'closed';
    }) => Promise<{ 
      data: GitHubIssue;
      headers: Record<string, string>;
    }>;
    
    pullRequest: (params: { 
      owner: string;
      repo: string;
      title: string;
      body: string;
      head: string;
      base: string;
      maintainer_can_modify?: boolean;
    }) => Promise<{ 
      data: GitHubPullRequest;
      headers: Record<string, string>;
    }>;
  };
  
  // Update methods
  update: {
    gist: (params: { 
      gist_id: string;
      description: string;
      files: Record<string, { 
        content: string;
        filename?: string;
      }>;
    }) => Promise<{ 
      data: GitHubGist;
      headers: Record<string, string>;
    }>;
    
    issue: (params: { 
      owner: string;
      repo: string;
      issue_number: number;
      title: string;
      body: string;
      assignee?: string;
      milestone?: string | number;
      labels?: string[];
      state?: 'open' | 'closed';
    }) => Promise<{ 
      data: GitHubIssue;
      headers: Record<string, string>;
    }>;
    
    pullRequest: (params: { 
      owner: string;
      repo: string;
      pull_number: number;
      title: string;
      body: string;
      state?: 'open' | 'closed';
    }) => Promise<{ 
      data: GitHubPullRequest;
      headers: Record<string, string>;
    }>;
  };
  
  // Delete methods
  delete: {
    gist: (params: { 
      gist_id: string;
    }) => Promise<{ 
      data: void;
      headers: Record<string, string>;
    }>;
    
    issue: (params: { 
      owner: string;
      repo: string;
      issue_number: number;
    }) => Promise<{ 
      data: void;
      headers: Record<string, string>;
    }>;
    
    pullRequest: (params: { 
      owner: string;
      repo: string;
      pull_number: number;
    }) => Promise<{ 
      data: void;
      headers: Record<string, string>;
    }>;
  };
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
