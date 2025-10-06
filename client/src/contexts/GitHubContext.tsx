import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { githubService } from '../services/github.service';
import type { GitHubRepository, GitHubFile, GitHubBranch } from '../services/github.service';

interface GitHubContextType {
  isAuthenticated: boolean;
  repositories: GitHubRepository[];
  currentRepo: GitHubRepository | null;
  currentBranch: string;
  branches: GitHubBranch[];
  currentPath: string;
  fileContent: string;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  loadRepositories: () => Promise<void>;
  selectRepository: (repo: GitHubRepository) => Promise<void>;
  selectBranch: (branchName: string) => Promise<void>;
  navigatePath: (path: string) => Promise<void>;
  loadFileContent: (path: string) => Promise<void>;
  saveFile: (path: string, content: string, message: string) => Promise<void>;
  createBranch: (branchName: string, fromBranch?: string) => Promise<void>;
  createPullRequest: (title: string, head: string, base: string, body?: string) => Promise<void>;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [currentRepo, setCurrentRepo] = useState<GitHubRepository | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      githubService.setToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          setLoading(true);
          // The server will handle the OAuth callback and redirect with a token
          // The token will be handled by the OAuthCallback component
        } catch (err) {
          setError('Failed to authenticate with GitHub');
          console.error(err);
        } finally {
          setLoading(false);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:5000/api/github/auth';
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    githubService.setToken('');
    setIsAuthenticated(false);
    setRepositories([]);
    setCurrentRepo(null);
    setBranches([]);
    setCurrentPath('');
    setFileContent('');
  };

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const repos = await githubService.getUserRepositories();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to load repositories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectRepository = async (repo: GitHubRepository) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentRepo(repo);
      setCurrentPath('');
      setFileContent('');
      
      // Load branches
      const [owner] = currentRepo.full_name.split('/');
      const repoBranches = await githubService.listBranches(owner, currentRepo.name);
      setBranches(repoBranches);
      
      // Set default branch
      if (repoBranches.length > 0) {
        const defaultBranch = repoBranches.find(b => b.name === repo.default_branch) || repoBranches[0];
        setCurrentBranch(defaultBranch.name);
      }
    } catch (err) {
      setError('Failed to load repository');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectBranch = async (branchName: string) => {
    setCurrentBranch(branchName);
    setCurrentPath('');
    setFileContent('');
  };

  const navigatePath = async (path: string) => {
    if (!currentRepo) return;
    
    try {
      setLoading(true);
      setError(null);
      setCurrentPath(path);
      
      // If it's a file, load its content
      if (path.includes('.')) {
        await loadFileContent(path);
      }
    } catch (err) {
      setError('Failed to navigate path');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (path: string) => {
    if (!currentRepo) return;
    
    try {
      setLoading(true);
      setError(null);
      const [owner] = currentRepo.full_name.split('/');
      const content = await githubService.getFileContent(owner, currentRepo.name, path, currentBranch);
      setFileContent(content);
    } catch (err) {
      setError('Failed to load file content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async (path: string, content: string, message: string) => {
    if (!currentRepo) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the current file to get its SHA if it exists
      const [owner] = currentRepo.full_name.split('/');
      const file = await githubService.getRepositoryContent(owner, currentRepo.name, path, currentBranch) as GitHubFile;
      if (file && file.sha) {
        await githubService.saveFile(
          owner,
          currentRepo.name,
          path,
          content,
          message,
          file.sha,
          currentBranch
        );
      } else {
        await githubService.saveFile(
          owner,
          currentRepo.name,
          path,
          content,
          message,
          undefined,
          currentBranch
        );
      }
      
      // Refresh file content
      await loadFileContent(path);
    } catch (err) {
      setError('Failed to save file');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async (branchName: string, fromBranch: string = 'main'): Promise<void> => {
    if (!currentRepo) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [owner] = currentRepo.full_name.split('/');
      await githubService.createBranch(
        owner,
        currentRepo.name,
        branchName,
        fromBranch
      );
      
      // Refresh branches list
      const updatedBranches = await githubService.listBranches(
        currentRepo.owner.login,
        currentRepo.name
      );
      setBranches(updatedBranches);
      return newBranch;
    } catch (err) {
      setError('Failed to create branch');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPullRequest = async (
    title: string,
    head: string,
    base: string,
    body: string = ''
  ) => {
    if (!currentRepo) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pr = await githubService.createPullRequest(
        currentRepo.owner.login,
        currentRepo.name,
        title,
        head,
        base,
        body
      );
      
      return pr;
    } catch (err) {
      setError('Failed to create pull request');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GitHubContext.Provider
      value={{
        isAuthenticated,
        repositories,
        currentRepo,
        currentBranch,
        branches,
        currentPath,
        fileContent,
        loading,
        error,
        login,
        logout,
        loadRepositories,
        selectRepository,
        selectBranch,
        navigatePath,
        loadFileContent,
        saveFile,
        createBranch,
        createPullRequest,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
};

export const useGitHub = (): GitHubContextType => {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
};
