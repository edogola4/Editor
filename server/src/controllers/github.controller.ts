import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { gitHubService } from '../services/github/GitHubService.js';
import User from '../models/User.js';
import { AppError } from '../utils/error.js';
import type { GitHubError } from '../types/github.js';

class GitHubController {
  /**
   * Initiate GitHub OAuth flow
   */
  public authorize(req: Request, res: Response, next: NextFunction): void {
    try {
      const { state } = req.query;
      const url = gitHubService.getAuthorizationUrl(state?.toString() || '');
      res.redirect(url);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GitHub OAuth callback
   */
  public async callback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        throw new AppError('Authorization code is required', 400);
      }

      // Exchange code for access token
      const tokenData = await gitHubService.getAccessToken(code.toString());
      
      // Get user info from GitHub
      const userInfo = await gitHubService.getUser(tokenData.access_token);
      
      // Find or create user in the database
      const UserModel = User;
      let user = await UserModel.findOne({ where: { githubId: userInfo.id.toString() } });
      
      // Prepare user data with type-safe token handling
      const userData: any = {
        username: userInfo.login,
        email: userInfo.email || `${userInfo.id}@github.com`,
        githubId: userInfo.id.toString(),
        githubAccessToken: tokenData.access_token,
        avatar: userInfo.avatar_url,
      };

      // Only include refresh_token if it exists in the token response
      if ('refresh_token' in tokenData) {
        userData.githubRefreshToken = tokenData.refresh_token;
      }
      
      if (!user) {
        // Create new user
        user = await UserModel.create(userData);
      } else {
        // Update existing user
        await user.update(userData);
      }

      // Generate JWT token
      const token = user.generateAuthToken();
      
      // Redirect to frontend with token
      const redirectUrl = new URL(state?.toString() || `${process.env.FRONTEND_URL}/dashboard`);
      redirectUrl.searchParams.set('token', token);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user repositories
   */
  public async listRepositories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      if (!user.githubAccessToken) {
        throw new AppError('GitHub not connected', 401);
      }

      const { page = '1', perPage = '30', visibility } = req.query;
      
      const repos = await gitHubService.listRepositories(user.githubAccessToken, {
        visibility: visibility as any,
        page: parseInt(page as string, 10),
        per_page: parseInt(perPage as string, 10),
      });

      res.json(repos);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Get repository content
   */
  public async getRepositoryContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo } = req.params;
      const { path = '', ref } = req.query;

      const content = await gitHubService.getRepositoryContent(
        user.githubAccessToken!,
        owner,
        repo,
        path as string,
        ref as string
      );

      res.json(content);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Get file content
   */
  public async getFileContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo, path } = req.params;
      const { ref } = req.query;

      const content = await gitHubService.getFileContent(
        user.githubAccessToken!,
        owner,
        repo,
        path,
        ref as string
      );

      res.json(content);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Create or update file
   */
  public async saveFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo, path } = req.params;
      const { content, message, sha, branch } = req.body;

      if (!content || !message) {
        throw new AppError('Content and message are required', 400);
      }

      const commit = await gitHubService.createOrUpdateFile(
        user.githubAccessToken!,
        owner,
        repo,
        path,
        {
          content,
          message,
          sha,
          branch,
          committer: {
            name: user.username,
            email: user.email,
          },
        }
      );

      res.json(commit);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * List branches
   */
  public async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo } = req.params;

      const branches = await gitHubService.listBranches(
        user.githubAccessToken!,
        owner,
        repo
      );

      res.json(branches);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Create branch
   */
  public async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo } = req.params;
      const { name, fromBranch = 'main' } = req.body;

      if (!name) {
        throw new AppError('Branch name is required', 400);
      }

      const branch = await gitHubService.createBranch(
        user.githubAccessToken!,
        owner,
        repo,
        name,
        fromBranch
      );

      res.status(201).json(branch);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Create pull request
   */
  public async createPullRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      const { owner, repo } = req.params;
      const { title, body, head, base, draft = false } = req.body;

      if (!title || !head || !base) {
        throw new AppError('Title, head and base are required', 400);
      }

      const pr = await gitHubService.createPullRequest(
        user.githubAccessToken!,
        owner,
        repo,
        {
          title,
          body: body || '',
          head,
          base,
          draft,
        }
      );

      res.status(201).json(pr);
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Handle GitHub webhook events
   */
  public handleWebhook(req: Request, res: Response, next: NextFunction): void {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      
      if (!signature) {
        throw new AppError('Missing signature', 401);
      }

      // Process the webhook
      gitHubService.handleWebhookEvent(signature, req.body, event);
      
      // Acknowledge receipt
      res.status(202).json({ received: true });
    } catch (error) {
      next(this.handleGitHubError(error));
    }
  }

  /**
   * Helper to handle GitHub API errors
   */
  private handleGitHubError(error: any): Error {
    console.error('GitHub API Error:', error);
    
    if (error instanceof GitHubError) {
      const appError = new AppError(error.message, error.status);
      // Add additional error details if needed
      return appError;
    }
    
    if (error.status) {
      const message = error.message || 'GitHub API error';
      const appError = new AppError(message, error.status);
      // Add response data if needed
      return appError;
    }
    
    return new AppError('An unexpected error occurred', 500);
  }
}

export const githubController = new GitHubController();
