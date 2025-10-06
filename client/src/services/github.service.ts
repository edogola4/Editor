import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
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

class GitHubService {
  private static instance: GitHubService;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('github_token');
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('github_token', token);
  }

  public getToken(): string | null {
    return this.token;
 }

  public async getUserRepositories(options: {
    visibility?: 'all' | 'public' | 'private';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
  } = {}): Promise<GitHubRepository[]> {
    const response = await this.request<GitHubRepository[]>('/github/repos', {
      params: {
        visibility: options.visibility || 'all',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
      },
    });
    return response.data;
  }

  public async getRepositoryContent(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<GitHubFile | GitHubFile[]> {
    const response = await this.request<GitHubFile | GitHubFile[]>(
      `/github/repos/${owner}/${repo}/contents/${path}`,
      {
        params: { ref },
      }
    );
    return response.data;
  }

  public async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const response = await this.request<GitHubFile>(
      `/github/repos/${owner}/${repo}/contents/${path}`,
      {
        params: { ref },
      }
    );
    
    if (response.data.encoding === 'base64' && response.data.content) {
      return atob(response.data.content);
    }
    
    return response.data.content || '';
  }

  public async saveFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<void> {
    await this.request(
      `/github/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        data: {
          content: btoa(content),
          message,
          sha,
          branch,
        },
      }
    );
  }

  public async listBranches(
    owner: string,
    repo: string
  ): Promise<GitHubBranch[]> {
    const response = await this.request<GitHubBranch[]>(
      `/github/repos/${owner}/${repo}/branches`
    );
    return response.data;
  }

  public async createBranch(
    owner: string,
    repo: string,
    branch: string,
    fromBranch: string = 'main'
  ): Promise<GitHubBranch> {
    const response = await this.request<GitHubBranch>(
      `/github/repos/${owner}/${repo}/branches`,
      {
        method: 'POST',
        data: {
          name: branch,
          fromBranch,
        },
      }
    );
    return response.data;
  }

  public async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string,
    draft: boolean = false
  ): Promise<any> {
    const response = await this.request(
      `/github/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        data: {
          title,
          head,
          base,
          body,
          draft,
        },
      }
    );
    return response.data;
  }

  private async request<T = any>(
    url: string,
    config: any = {}
  ): Promise<{ data: T }> {
    if (!this.token) {
      throw new Error('GitHub token not found. Please authenticate first.');
    }

    const response = await axios({
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      withCredentials: true,
      ...config,
    });

    return response.data;
  }
}

export const githubService = GitHubService.getInstance();
