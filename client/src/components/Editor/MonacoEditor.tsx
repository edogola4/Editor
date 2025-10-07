import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { useTheme } from '../../contexts/ThemeContext';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { debounce } from 'lodash';

// Supported languages with their file extensions
const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs'] },
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { id: 'python', name: 'Python', extensions: ['.py'] },
  { id: 'java', name: 'Java', extensions: ['.java'] },
  { id: 'csharp', name: 'C#', extensions: ['.cs'] },
  { id: 'cpp', name: 'C++', extensions: ['.cpp', '.h', '.hpp'] },
  { id: 'go', name: 'Go', extensions: ['.go'] },
  { id: 'rust', name: 'Rust', extensions: ['.rs'] },
  { id: 'ruby', name: 'Ruby', extensions: ['.rb'] },
  { id: 'php', name: 'PHP', extensions: ['.php'] },
  { id: 'json', name: 'JSON', extensions: ['.json'] },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', name: 'CSS', extensions: ['.css'] },
  { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'] },
];

interface MonacoEditorProps {
  initialValue?: string;
  language?: string;
  onContentChange?: (value: string) => void;
  readOnly?: boolean;
  path?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  initialValue = '',
  language = 'plaintext',
  onContentChange,
  readOnly = false,
  path = 'untitled.txt',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();
  const { users, onContentChange: onCollaborationChange } = useCollaboration();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);
  const [isFoldingEnabled, setIsFoldingEnabled] = useState(true);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Cleanup previous instance if exists
    if (editorInstance.current) {
      editorInstance.current.dispose();
    }

    // Create editor instance
    editorInstance.current = monaco.editor.create(editorRef.current, {
      value: initialValue,
      language: currentLanguage,
      theme: theme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: isMinimapEnabled },
      folding: isFoldingEnabled,
      wordWrap: isWordWrapEnabled ? 'on' : 'off',
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly,
      fontSize: 14,
      tabSize: 2,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      formatOnPaste: true,
      formatOnType: true,
      autoIndent: 'full',
      // Enable multi-cursor
      multiCursorModifier: 'alt',
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
    });

    // Set up content change handler with debounce
    const debouncedChangeHandler = debounce((value: string) => {
      onContentChange?.(value);
      onCollaborationChange?.(value);
    }, 300);

    const disposable = editorInstance.current.onDidChangeModelContent(() => {
      const value = editorInstance.current?.getValue() || '';
      debouncedChangeHandler(value);
    });

    // Set up IntelliSense/autocompletion
    monaco.languages.registerCompletionItemProvider(currentLanguage, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Default suggestions
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'log',
            kind: monaco.languages.CompletionItemKind.Function,
            documentation: 'Console log',
            insertText: 'console.log($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
          },
        ];

        return { suggestions };
      },
    });

    // Cleanup function
    return () => {
      disposable.dispose();
      editorInstance.current?.dispose();
    };
  }, [currentLanguage, theme, isMinimapEnabled, isFoldingEnabled, isWordWrapEnabled]);

  // Update editor content when initialValue changes
  useEffect(() => {
    if (editorInstance.current && editorInstance.current.getValue() !== initialValue) {
      editorInstance.current.setValue(initialValue);
    }
  }, [initialValue]);

  // Update editor language when language changes
  useEffect(() => {
    if (editorInstance.current) {
      const model = editorInstance.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, currentLanguage);
      }
    }
  }, [currentLanguage]);

  // Update editor theme when theme changes
  useEffect(() => {
    if (editorInstance.current) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }, [theme]);

  // Handle find/replace
  const handleFind = useCallback(() => {
    editorInstance.current?.getAction('actions.find')?.run();
  }, []);

  // Handle format document
  const handleFormat = useCallback(async () => {
    if (editorInstance.current) {
      try {
        await editorInstance.current.getAction('editor.action.formatDocument')?.run();
      } catch (error) {
        console.error('Error formatting document:', error);
      }
    }
  }, []);

  // Toggle minimap
  const toggleMinimap = useCallback(() => {
    setIsMinimapEnabled(prev => !prev);
  }, []);

  // Toggle code folding
  const toggleFolding = useCallback(() => {
    setIsFoldingEnabled(prev => !prev);
  }, []);

  // Toggle word wrap
  const toggleWordWrap = useCallback(() => {
    setIsWordWrapEnabled(prev => !prev);
  }, []);

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentLanguage(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 p-2 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
        <select
          value={currentLanguage}
          onChange={handleLanguageChange}
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>

        <button
          onClick={toggleMinimap}
          className={`p-1 rounded ${isMinimapEnabled ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          title="Toggle Minimap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <button
          onClick={toggleFolding}
          className={`p-1 rounded ${isFoldingEnabled ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          title="Toggle Code Folding"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          onClick={toggleWordWrap}
          className={`p-1 rounded ${isWordWrapEnabled ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          title="Toggle Word Wrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <div className="flex-grow"></div>

        <button
          onClick={handleFind}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Find"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button
          onClick={handleFormat}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Format Document"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Editor container */}
      <div ref={editorRef} className="flex-1" />

      {/* Status bar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <div>
          {path && <span className="mr-4">{path}</span>}
          <span>{currentLanguage.toUpperCase()}</span>
        </div>
        {users.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="flex -space-x-1">
              {users.slice(0, 3).map((user, index) => (
                <span
                  key={user.id}
                  className="w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                />
              ))}
              {users.length > 3 && (
                <span className="flex items-center justify-center w-4 h-4 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                  +{users.length - 3}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonacoEditor;
