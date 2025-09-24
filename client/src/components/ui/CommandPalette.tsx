import React, { useState, useEffect } from 'react';
import { Search, Command as CommandIcon, FileText, Settings, Terminal, GitBranch, Play, Square } from 'lucide-react';
import type { CommandPaletteProps, Command } from '../../types';
import Button from './Button';
import Modal from './Modal';

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Default commands if none provided
  const defaultCommands: Command[] = [
    {
      id: 'run',
      label: 'Run Code',
      description: 'Execute the current file or project',
      icon: Play,
      shortcut: 'F5',
      action: () => console.log('Running code...')
    },
    {
      id: 'stop',
      label: 'Stop Execution',
      description: 'Stop the currently running process',
      icon: Square,
      shortcut: 'Shift+F5',
      action: () => console.log('Stopping execution...')
    },
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      icon: FileText,
      shortcut: 'Ctrl+N',
      action: () => console.log('Creating new file...')
    },
    {
      id: 'open-file',
      label: 'Open File',
      description: 'Open an existing file',
      icon: FileText,
      shortcut: 'Ctrl+O',
      action: () => console.log('Opening file...')
    },
    {
      id: 'save-file',
      label: 'Save File',
      description: 'Save the current file',
      icon: FileText,
      shortcut: 'Ctrl+S',
      action: () => console.log('Saving file...')
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open editor settings',
      icon: Settings,
      shortcut: 'Ctrl+,',
      action: () => console.log('Opening settings...')
    },
    {
      id: 'terminal',
      label: 'Toggle Terminal',
      description: 'Show or hide the terminal panel',
      icon: Terminal,
      shortcut: 'Ctrl+`',
      action: () => console.log('Toggling terminal...')
    },
    {
      id: 'git-status',
      label: 'Git Status',
      description: 'Check git repository status',
      icon: GitBranch,
      shortcut: 'Ctrl+Shift+G',
      action: () => console.log('Checking git status...')
    }
  ];

  const allCommands = commands.length > 0 ? commands : defaultCommands;

  const filteredCommands = allCommands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
      closeOnOverlayClick={true}
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Commands list */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8">
              <Command className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">No commands found</p>
              <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200
                    ${index === selectedIndex
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-slate-700/30'
                    }
                  `}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                >
                  {command.icon && (
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${index === selectedIndex
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-slate-700/50 text-slate-400'
                      }
                    `}>
                      <command.icon className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium truncate">{command.label}</h3>
                      {command.shortcut && (
                        <kbd className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono border border-slate-600">
                          {command.shortcut}
                        </kbd>
                      )}
                    </div>

                    {command.description && (
                      <p className="text-slate-400 text-sm truncate mt-1">
                        {command.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>

          <div className="text-xs text-slate-500">
            {filteredCommands.length} commands
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CommandPalette;
