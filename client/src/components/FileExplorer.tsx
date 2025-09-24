import React, { useState, useMemo } from 'react';
import { FileText, Folder, FolderOpen, Search, Plus, MoreHorizontal } from 'lucide-react';
import { FileNode, FileExplorerProps } from '../types';

const FileTreeNode: React.FC<{
  node: FileNode;
  level: number;
  onFileSelect: (file: FileNode) => void;
  onFileOpen: (file: FileNode) => void;
  selectedFile?: string;
}> = ({ node, level, onFileSelect, onFileOpen, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || false);
  const [isHovered, setIsHovered] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFile === node.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    if (node.type === 'file') {
      onFileSelect(node);
    }
  };

  const handleDoubleClick = () => {
    if (node.type === 'file') {
      onFileOpen(node);
    }
  };

  const getFileIcon = () => {
    if (node.type === 'directory') {
      return isOpen ? FolderOpen : Folder;
    }

    // File type icons
    const iconMap: Record<string, any> = {
      'js': FileText,
      'jsx': FileText,
      'ts': FileText,
      'tsx': FileText,
      'json': FileText,
      'md': FileText,
      'css': FileText,
      'html': FileText,
      'py': FileText,
      'java': FileText,
      'cpp': FileText,
      'c': FileText,
    };

    const Icon = iconMap[node.fileType || ''] || FileText;
    return Icon;
  };

  const Icon = getFileIcon();

  const indent = level * 16;

  return (
    <div>
      <div
        className={`group flex items-center py-1 px-2 hover:bg-slate-700/50 rounded transition-all duration-200 cursor-pointer ${
          isSelected ? 'bg-slate-700/70' : ''
        }`}
        style={{ paddingLeft: `${8 + indent}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleToggle}
        onDoubleClick={handleDoubleClick}
        role="button"
        tabIndex={0}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={isSelected}
      >
        {/* Expand/Collapse indicator */}
        {hasChildren && (
          <div className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}>
            <div className="w-0 h-0 border-l-2 border-l-slate-400 border-b-2 border-b-transparent rotate-45 transform origin-center" />
          </div>
        )}

        {/* File/Directory Icon */}
        <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${
          node.type === 'directory'
            ? 'text-amber-400'
            : node.fileType === 'ts' || node.fileType === 'tsx'
              ? 'text-blue-400'
              : 'text-slate-400'
        }`} />

        {/* Name */}
        <span className={`text-sm truncate flex-1 ${
          isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
        }`}>
          {node.name}
        </span>

        {/* Actions on hover */}
        {isHovered && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
            <button
              className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
              title={`More actions for ${node.name}`}
              aria-label={`More actions for ${node.name}`}
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="animate-slide-down">
          {node.children!.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFileOpen={onFileOpen}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileOpen,
  selectedFile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .map(node => ({
          ...node,
          children: node.children ? filterNodes(node.children) : undefined
        }))
        .filter(node =>
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (node.children && node.children.length > 0)
        );
    };

    return filterNodes(files);
  }, [files, searchTerm]);

  const handleNewFile = () => {
    // TODO: Implement new file creation
    console.log('Create new file');
  };

  return (
    <div className="h-full bg-slate-800/30 border-r border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-200">Explorer</h3>
          <div className="flex items-center space-x-1">
            <button
              className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors"
              onClick={handleNewFile}
              title="New file"
              aria-label="Create new file"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse explorer' : 'Expand explorer'}
              aria-label={isExpanded ? 'Collapse explorer' : 'Expand explorer'}
            >
              <div className={`w-0 h-0 border-l-2 border-l-slate-400 border-b-2 border-b-transparent transform origin-center transition-transform ${
                isExpanded ? '-rotate-90' : 'rotate-90'
              }`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-slate-700/50 border border-slate-600/30 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-slate-700/70 transition-colors"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        isExpanded ? 'opacity-100' : 'opacity-0'
      }`}>
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <div className="py-2">
            {filteredFiles.map((file) => (
              <FileTreeNode
                key={file.path}
                node={file}
                level={0}
                onFileSelect={onFileSelect}
                onFileOpen={onFileOpen}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        .animate-slide-down {
          animation: slideDown 0.2s ease-out;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
