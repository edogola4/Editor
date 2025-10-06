import { Octokit } from '@octokit/rest';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import { createAppAuth } from '@octokit/auth-app';
import { Webhooks } from '@octokit/webhooks';
import { config } from '../../config/index';
import {
  GitHubUser,
  GitHubRepository,
  GitHubFile,
  GitHubBranch,
  GitHubCommit,
  GitHubPullRequest,
  GitHubServiceOptions,
  GitHubFileContent,
  GitHubCommitOptions,
  GitHubCreatePROptions,
  GitHubMergeOptions,
  GitHubConflict,
  GitHubError,
  GitHubClient,
  GitHubWebhookConfig,
} from '../../types/github';

export class GitHubService {
  private clientId: string;
  private clientSecret: string;
  private webhookSecret: string;
  private appName: string;
  private baseUrl: string;
  private webhooks: Webhooks;

  constructor(options: GitHubServiceOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.webhookSecret = options.webhookSecret;
    this.appName = options.appName;
    this.baseUrl = options.baseUrl;
    this.webhooks = new Webhooks({
      secret: this.webhookSecret,
    });
  }

  /**
   * Create an Octokit instance with user access token
   */
  private createClient(accessToken: string): GitHubClient {
    return new Octokit({
      auth: accessToken,
      userAgent: this.appName,
      baseUrl: 'https://api.github.com',
      log: {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
      request: {
        timeout: 10000,
      },
    });
  }

  /**
   * Get the OAuth authorization URL
   */
  getAuthorizationUrl(state: string, scopes: string[] = ['repo', 'user:email']): string {
    const baseUrl = 'https://github.com/login/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${this.baseUrl}/api/github/callback`,
      scope: scopes.join(' '),
      state,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange code for access token
   */
  async getAccessToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
  }> {
    const auth = createOAuthAppAuth({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    const { token } = await auth({
      type: 'oauth-user',
      code,
    });

    // Get the full token data
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: `${this.baseUrl}/api/github/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GitHubError(
        data.error_description || 'Failed to get access token',
        response.status,
        {},
        null,
        data.error_uri,
        data.errors
      );
    }

    return data;
  }

  /**
   * Get authenticated user
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.users.getAuthenticated();
    return data as GitHubUser;
  }

  /**
   * List user repositories
   */
  async listRepositories(accessToken: string, options: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      ...options,
      per_page: options.per_page || 30,
      page: options.page || 1,
    });
    return data as GitHubRepository[];
  }

  /**
   * Get repository content
   */
  async getRepositoryContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<GitHubFile | GitHubFile[]> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    return data as GitHubFile | GitHubFile[];
  }

  /**
   * Get file content
   */
  async getFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFileContent> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(data)) {
      throw new GitHubError('Path is a directory, not a file', 400);
    }

    return data as GitHubFileContent;
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    options: GitHubCommitOptions
  ): Promise<GitHubCommit> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: options.message,
      content: Buffer.from(options.content).toString('base64'),
      sha: options.sha,
      branch: options.branch,
      committer: options.committer,
    });
    return data.commit as GitHubCommit;
  }

  /**
   * List repository branches
   */
  async listBranches(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubBranch[]> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
    });
    return data as GitHubBranch[];
  }

  /**
   * Create a new branch
   */
  async createBranch(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string,
    fromBranch: string = 'main'
  ): Promise<GitHubBranch> {
    const octokit = this.createClient(accessToken);
    
    // Get the SHA of the base branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromBranch}`,
    });

    // Create new branch
    const { data } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: refData.object.sha,
    });

    return {
      name: branch,
      commit: {
        sha: refData.object.sha,
        url: refData.object.url,
      },
      protected: false,
    };
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    options: GitHubCreatePROptions
  ): Promise<GitHubPullRequest> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title: options.title,
      body: options.body,
      head: options.head,
      base: options.base,
      maintainer_can_modify: options.maintainer_can_modify,
      draft: options.draft,
    });
    return data as GitHubPullRequest;
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number,
    options: GitHubMergeOptions = {}
  ): Promise<{ sha: string; merged: boolean; message: string }> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      commit_title: options.commit_title,
      commit_message: options.commit_message,
      merge_method: options.merge_method,
    });
    return data;
  }

  /**
   * Handle GitHub webhook events
   */
  handleWebhookEvent(signature: string, payload: any, event: string): void {
    // Verify the webhook signature
    const isValid = this.webhooks.verify(payload, signature);
    if (!isValid) {
      throw new GitHubError('Invalid webhook signature', 401);
    }

    // Emit the event
    this.webhooks.receive({
      id: payload.installation?.id?.toString() || 'unknown',
      name: event as any,
      payload,
    });
  }

  /**
   * Add a webhook to a repository
   */
  async addWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    config: GitHubWebhookConfig
  ): Promise<any> {
    const octokit = this.createClient(accessToken);
    const { data } = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: config.url,
        content_type: config.contentType,
        secret: config.secret,
      },
      events: config.events,
      active: config.active !== false,
    });
    return data;
  }

  /**
   * Handle rate limits and retries
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error
        if (error.status === 403 && error.headers?.['x-ratelimit-remaining'] === '0') {
          const resetTime = parseInt(error.headers['x-ratelimit-reset'], 10) * 1000;
          const waitTime = Math.max(resetTime - Date.now(), 0) + 1000; // Add 1s buffer
          
          console.warn(`Rate limit exceeded. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // For other errors, wait with exponential backoff
        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(2, i);
          console.warn(`Request failed, retrying in ${waitTime}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }
}

// Export a singleton instance
export const gitHubService = new GitHubService({
  clientId: config.github.clientId,
  clientSecret: config.github.clientSecret,
  webhookSecret: config.github.webhookSecret,
  appName: 'Collaborative-Editor',
  baseUrl: config.app.baseUrl,
});
