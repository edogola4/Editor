import React, { useState, useEffect } from 'react';
import { useGitHub } from '../../contexts/GitHubContext';
import { Folder, File, GitBranch, GitPullRequest, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { useToast } from '../ui/use-toast';

export const GitHubRepoBrowser: React.FC = () => {
  const {
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
    loadRepositories,
    selectRepository,
    selectBranch,
    navigatePath,
    loadFileContent,
    saveFile,
    createBranch,
    createPullRequest,
  } = useGitHub();

  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isCreatePROpen, setIsCreatePROpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('Update file');
  
  const { toast } = useToast();

  // Load repositories on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadRepositories();
    }
  }, [isAuthenticated, loadRepositories]);

  // Load repository content when repo or branch changes
  useEffect(() => {
    if (currentRepo) {
      navigatePath(currentPath);
    }
  }, [currentRepo, currentBranch, navigatePath, currentPath]);

  const handleFileClick = async (item: any) => {
    if (item.type === 'dir') {
      navigatePath(item.path);
    } else {
      const content = await loadFileContent(item.path);
      setSelectedFile({ path: item.path, content });
      setEditContent(content);
      setIsEditing(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    
    try {
      await saveFile(selectedFile.path, editContent, commitMessage);
      setSelectedFile({ ...selectedFile, content: editContent });
      setIsEditing(false);
      toast({
        title: 'File saved',
        description: 'Your changes have been saved to GitHub.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    try {
      await createBranch(newBranchName);
      setIsCreateBranchOpen(false);
      setNewBranchName('');
      toast({
        title: 'Branch created',
        description: `Created branch ${newBranchName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create branch. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePR = async () => {
    if (!prTitle.trim() || !currentBranch) return;
    
    try {
      const baseBranch = currentRepo?.default_branch || 'main';
      const pr = await createPullRequest(prTitle, currentBranch, baseBranch, prBody);
      setIsCreatePROpen(false);
      setPrTitle('');
      setPrBody('');
      toast({
        title: 'Pull request created',
        description: (
          <a 
            href={pr.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            View pull request on GitHub
          </a>
        ),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create pull request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Connect to GitHub</h3>
        <p className="text-gray-500 mb-4 text-center">
          Connect your GitHub account to browse repositories and collaborate on code.
        </p>
        <Button onClick={login} className="gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.39-1.332-1.756-1.332-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Connect with GitHub
        </Button>
      </div>
    );
  }

  if (loading && !currentRepo) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error loading GitHub data</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" onClick={loadRepositories} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Repository selector */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <select
              value={currentRepo?.id || ''}
              onChange={(e) => {
                const repo = repositories.find((r) => r.id === Number(e.target.value));
                if (repo) selectRepository(repo);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              disabled={loading}
            >
              <option value="">Select a repository</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>
          
          {currentRepo && (
            <div className="ml-2 flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <GitBranch className="h-4 w-4" />
                    {currentBranch}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {branches.map((branch) => (
                    <DropdownMenuItem
                      key={branch.name}
                      onSelect={() => selectBranch(branch.name)}
                      className={branch.name === currentBranch ? 'bg-gray-100' : ''}
                    >
                      {branch.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onSelect={() => setIsCreateBranchOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create new branch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCreatePROpen(true)}
                disabled={!currentBranch || currentBranch === currentRepo?.default_branch}
              >
                <GitPullRequest className="h-4 w-4 mr-1" />
                Create PR
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* File browser */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          {currentRepo ? (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                Files
              </div>
              <div className="space-y-1">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentPath && (
                      <button
                        onClick={() => {
                          const parentPath = currentPath.split('/').slice(0, -1).join('/');
                          navigatePath(parentPath);
                        }}
                        className="flex items-center w-full text-left p-2 text-sm rounded hover:bg-gray-100"
                      >
                        <span className="text-gray-500">..</span>
                      </button>
                    )}
                    
                    {currentRepo && (
                      <GitHubFileTree
                        owner={currentRepo.owner.login}
                        repo={currentRepo.name}
                        path={currentPath}
                        onFileClick={handleFileClick}
                        currentBranch={currentBranch}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Select a repository to browse files
            </div>
          )}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">{selectedFile.path}</h3>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveFile} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <div className="flex-1 flex flex-col space-y-2">
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message"
                    className="text-sm"
                  />
                  <div className="flex-1 border rounded-md overflow-hidden">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full p-2 font-mono text-sm focus:outline-none resize-none"
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {selectedFile.content || 'No content'}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a file to view or edit
            </div>
          )}
        </div>
      </div>

      {/* Create Branch Dialog */}
      <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch from the current branch ({currentBranch}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name
              </label>
              <Input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/new-feature"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBranchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PR Dialog */}
      <Dialog open={isCreatePROpen} onOpenChange={setIsCreatePROpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pull Request</DialogTitle>
            <DialogDescription>
              Create a pull request from <span className="font-medium">{currentBranch}</span> to{' '}
              <span className="font-medium">{currentRepo?.default_branch || 'main'}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                placeholder="Update feature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={prBody}
                onChange={(e) => setPrBody(e.target.value)}
                className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                placeholder="Describe your changes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePROpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePR} disabled={!prTitle.trim()}>
              Create Pull Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for recursive file tree
const GitHubFileTree: React.FC<{
  owner: string;
  repo: string;
  path: string;
  onFileClick: (item: any) => void;
  currentBranch: string;
}> = ({ owner, repo, path, onFileClick, currentBranch }) => {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${currentBranch}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to load directory contents');
        }
        
        const data = await response.json();
        setContents(Array.isArray(data) ? data : [data]);
        setError(null);
      } catch (err) {
        setError('Failed to load directory');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [owner, repo, path, currentBranch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm p-2">{error}</div>;
  }

  return (
    <div className="space-y-1">
      {contents.map((item) => (
        <div
          key={item.path}
          onClick={() => onFileClick(item)}
          className="flex items-center p-2 text-sm rounded hover:bg-gray-100 cursor-pointer"
        >
          {item.type === 'dir' ? (
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <File className="h-4 w-4 mr-2 text-gray-500" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
      ))}
    </div>
  );
};
