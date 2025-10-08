import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { debounce, throttle } from 'lodash';
import { useTheme } from '../../contexts/ThemeContext';
import { useCollaboration } from '../../contexts/CollaborationContext';
import type { User } from '../../contexts/CollaborationContext';
import { CursorIndicator } from './CursorIndicator';
import { CollaborationStatus } from './CollaborationStatus';
import UserPresenceList from '../collaboration/UserPresenceList';
import ConnectionStatus from '../collaboration/ConnectionStatus';
import { motion, AnimatePresence } from 'framer-motion';

// MUI Components
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

// MUI Icons
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WrapTextIcon from '@mui/icons-material/WrapText';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import MapIcon from '@mui/icons-material/Map';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Enhanced language configurations
const LANGUAGE_CONFIGS = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs'],
    defaultContent: '// JavaScript code\nfunction hello() {\n  console.log("Hello, world!");\n}\n',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    defaultContent: '// TypeScript code\nconst greet = (name: string): string => {\n  return `Hello, ${name}!`;\n};\n',
  },
  {
    id: 'python',
    name: 'Python',
    extensions: ['.py'],
    defaultContent: '# Python code\ndef hello():\n    print("Hello, world!")\n',
  },
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
  onCursorChange?: (position: monaco.Position) => void;
  onSelectionChange?: (selection: monaco.Selection) => void;
  readOnly?: boolean;
  path?: string;
  documentId?: string;
  showCollaborationStatus?: boolean;
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  showFolding?: boolean;
  showWordWrap?: boolean;
  showErrorPanel?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  initialValue = '',
  language = 'plaintext',
  onContentChange,
  onCursorChange,
  onSelectionChange,
  readOnly = false,
  path = 'untitled.txt',
  documentId,
  showCollaborationStatus = true,
  showMinimap = true,
  showLineNumbers = true,
  showFolding = true,
  showWordWrap = false,
  showErrorPanel = true,
  autoSave = false,
  autoSaveInterval = 5000, // 5 seconds
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorations = useRef<string[]>([]);
  const errorMarkers = useRef<monaco.editor.IMarkerData[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { theme } = useTheme();
  const { users, onContentChange: onCollaborationChange, broadcastCursorPosition } = useCollaboration();
  
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isMinimapEnabled, setIsMinimapEnabled] = useState(showMinimap);
  const [isFoldingEnabled, setIsFoldingEnabled] = useState(showFolding);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(showWordWrap);
  const [isErrorPanelVisible, setIsErrorPanelVisible] = useState(showErrorPanel);
  const [errors, setErrors] = useState<monaco.editor.IMarker[]>([]);
  const [warnings, setWarnings] = useState<monaco.editor.IMarker[]>([]);
  const [infos, setInfos] = useState<monaco.editor.IMarker[]>([]);
  const [currentUserCursor, setCurrentUserCursor] = useState<monaco.Position | null>(null);
  const [currentUserSelection, setCurrentUserSelection] = useState<monaco.Selection | null>(null);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Save view state before disposing
    const viewState = editorInstance.current?.saveViewState();
    
    // Create or update editor instance
    if (!editorInstance.current) {
      // First-time initialization
      editorInstance.current = monaco.editor.create(editorRef.current, {
        value: initialValue,
        language: currentLanguage,
        theme: theme === 'dark' ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: isMinimapEnabled },
        folding: isFoldingEnabled,
        wordWrap: isWordWrapEnabled ? 'on' : 'off',
        lineNumbers: showLineNumbers ? 'on' : 'off',
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
        multiCursorModifier: 'alt',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showClasses: true,
          showFunctions: true,
          showVariables: true,
          showModules: true,
          showFiles: true,
          showReferences: true,
          showValues: true,
          showConstants: true,
          showConstructors: true,
          showTypeParameters: true,
          showIssues: true,
          showUsers: true,
          showFolders: true,
          showReferencesCodeLens: true,
          showInlineHints: true,
        },
        'bracketPairColorization.enabled': true,
        'semanticHighlighting.enabled': true,
      });
      
      // Set up cursor change listener
      editorInstance.current.onDidChangeCursorPosition((e) => {
        setCurrentUserCursor(e.position);
        onCursorChange?.(e.position);
        
        // Broadcast cursor position to other users
        if (broadcastCursorPosition) {
          broadcastCursorPosition({
            lineNumber: e.position.lineNumber,
            column: e.position.column
          });
        }
      });

      // Set up selection change listener
      editorInstance.current.onDidChangeCursorSelection((e) => {
        setCurrentUserSelection(e.selection);
        onSelectionChange?.(e.selection);
      });
      
      // Restore view state if available
      if (viewState) {
        editorInstance.current.restoreViewState(viewState);
      }
    } else {
      // Update existing editor
      editorInstance.current.updateOptions({
        theme: theme === 'dark' ? 'vs-dark' : 'vs',
        minimap: { enabled: isMinimapEnabled },
        folding: isFoldingEnabled,
        wordWrap: isWordWrapEnabled ? 'on' : 'off',
        lineNumbers: showLineNumbers ? 'on' : 'off',
        readOnly,
      });
    }

    // Set up content change handler with debounce
    const debouncedChangeHandler = debounce((value: string, changes: editor.IModelContentChangedEvent) => {
      onContentChange?.(value);
      
      // Broadcast changes to other collaborators
      if (onCollaborationChange) {
        const changeData = {
          documentId,
          changes: changes.changes.map(change => ({
            range: {
              startLineNumber: change.range.startLineNumber,
              startColumn: change.range.startColumn,
              endLineNumber: change.range.endLineNumber,
              endColumn: change.range.endColumn,
            },
            text: change.text,
            rangeLength: change.rangeLength,
            rangeOffset: change.rangeOffset,
          })),
          versionId: changes.versionId,
          isUndoing: changes.isUndoing,
          isRedoing: changes.isRedoing,
          timestamp: Date.now(),
        };
        
        onCollaborationChange(value, changeData);
      }
    }, 300);

    // Set up cursor and selection change handlers
    const cursorChangeDisposable = editorInstance.current.onDidChangeCursorPosition((e) => {
      setCurrentUserCursor(e.position);
      onCursorChange?.(e.position);
      broadcastCursorPosition?.({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    const selectionChangeDisposable = editorInstance.current.onDidChangeCursorSelection((e) => {
      setCurrentUserSelection(e.selection);
      onSelectionChange?.(e.selection);
    });

    const modelContentChangeDisposable = editorInstance.current.onDidChangeModelContent((e) => {
      const value = editorInstance.current?.getValue() || '';
      debouncedChangeHandler(value);
      validateCode();
    });

    // Set up auto-save if enabled
    if (autoSave) {
      autoSaveTimer.current = setInterval(() => {
        const value = editorInstance.current?.getValue();
        if (value !== undefined) {
          onContentChange?.(value);
        }
      }, autoSaveInterval);
    }

    // Set up IntelliSense/autocompletion
    const setupIntelliSense = () => {
      // Only set up for languages that support it
      if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(currentLanguage)) {
        // Configure TypeScript/JavaScript defaults
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          noSuggestionDiagnostics: false,
          diagnosticCodesToIgnore: [],
        });

        // Set compiler options for TypeScript/JavaScript
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          noEmit: true,
          typeRoots: ['node_modules/@types'],
          jsx: monaco.languages.typescript.JsxEmit.React,
          allowJs: true,
          checkJs: true,
        });

        // Add type definitions for common libraries
        const libs = ['es5', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'dom', 'dom.iterable', 'webworker', 'scripthost'];
        libs.forEach(lib => {
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            `/// <reference no-default-lib="true"/>
            /// <reference lib="${lib}" />`,
            `ts:types/${lib}`
          );
        });
      }

      // Register completion item provider
      const provider = monaco.languages.registerCompletionItemProvider(currentLanguage, {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };

          // Common suggestions
          const suggestions: monaco.languages.CompletionItem[] = [
            {
              label: 'log',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Console log',
              insertText: 'console.log(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
            {
              label: 'warn',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Console warning',
              insertText: 'console.warn(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
            {
              label: 'error',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Console error',
              insertText: 'console.error(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
          ];

          // Add language-specific suggestions
          if (currentLanguage === 'javascript' || currentLanguage === 'typescript') {
            suggestions.push(
              {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Keyword,
                documentation: 'Function declaration',
                insertText: 'function ${1:name}(${2:params}) {\n  ${3:// code}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
              },
              {
                label: 'arrow',
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: 'Arrow function',
                insertText: 'const ${1:name} = (${2:params}) => {\n  ${3:// code}\n};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
              }
            );
          }

          return { suggestions };
        },
      });

      return provider;
    };

    const intellisenseProvider = setupIntelliSense();

    // Set up error markers
    const setupErrorMarkers = () => {
      if (!editorInstance.current) return () => {};
      
      const model = editorInstance.current.getModel();
      if (!model) return () => {};
      
      // Listen for model markers changes
      const updateMarkers = () => {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        
        // Categorize markers by severity
        const newErrors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
        const newWarnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning);
        const newInfos = markers.filter(m => m.severity === monaco.MarkerSeverity.Info);
        
        setErrors(newErrors);
        setWarnings(newWarnings);
        setInfos(newInfos);
      };
      
      // Initial update
      updateMarkers();
      
      // Listen for marker changes
      const disposable = monaco.editor.onDidChangeMarkers(updateMarkers);
      return disposable;
    };
    
    const markersDisposable = setupErrorMarkers();

    // Cleanup function
    return () => {
      cursorChangeDisposable.dispose();
      selectionChangeDisposable.dispose();
      modelContentChangeDisposable.dispose();
      intellisenseProvider?.dispose();
      markersDisposable?.dispose();
      
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [
    currentLanguage, 
    theme, 
    isMinimapEnabled, 
    isFoldingEnabled, 
    isWordWrapEnabled,
    showLineNumbers,
    readOnly,
    onContentChange,
    onCursorChange,
    onSelectionChange,
    broadcastCursorPosition,
    autoSave,
    autoSaveInterval,
  ]);
  
  // Clean up editor on unmount
  useEffect(() => {
    return () => {
      if (editorInstance.current) {
        editorInstance.current.dispose();
        editorInstance.current = null;
      }
    };
  }, []);

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
        
        // Update editor options based on language
        const options: monaco.editor.IEditorOptions = {
          // Reset any language-specific options here
        };
        
        // Set language-specific options
        const langConfig = LANGUAGE_CONFIGS.find(lang => lang.id === currentLanguage);
        if (langConfig) {
          if (langConfig.compilerOptions) {
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
              ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
              ...langConfig.compilerOptions,
            });
          }
          
          // Set default content if editor is empty
          if (langConfig.defaultContent && (!initialValue || initialValue.trim() === '')) {
            editorInstance.current.setValue(langConfig.defaultContent);
          }
        }
        
        editorInstance.current.updateOptions(options);
        
        // Trigger validation after language change
        validateCode();
      }
    }
  }, [currentLanguage, initialValue]);

  // Update editor theme when theme changes
  useEffect(() => {
    if (editorInstance.current) {
      const themeName = theme === 'dark' ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(themeName);
      
      // Update editor options based on theme
      const options: monaco.editor.IEditorOptions = {
        theme: themeName,
        // Add any theme-specific options here
      };
      
      editorInstance.current.updateOptions(options);
    }
  }, [theme]);
  
  // Validate code for errors and warnings
  const validateCode = useCallback(() => {
    if (!editorInstance.current) return;
    
    const model = editorInstance.current.getModel();
    if (!model) return;
    
    // Clear previous decorations
    decorations.current = editorInstance.current.deltaDecorations(decorations.current, []);
    
    // Get current markers
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    
    // Update state with new markers
    const newErrors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);
    const newWarnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning);
    const newInfos = markers.filter(m => m.severity === monaco.MarkerSeverity.Info);
    
    setErrors(newErrors);
    setWarnings(newWarnings);
    setInfos(newInfos);
    
    // Add decorations for errors and warnings
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    
    // Add error squiggles
    newErrors.forEach(error => {
      newDecorations.push({
        range: new monaco.Range(
          error.startLineNumber,
          error.startColumn,
          error.endLineNumber,
          error.endColumn
        ),
        options: {
          className: 'squiggly-error',
          glyphMarginClassName: 'error-glyph',
          hoverMessage: { value: error.message },
          overviewRuler: {
            color: { id: 'editorError.foreground' },
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      });
    });
    
    // Add warning squiggles
    newWarnings.forEach(warning => {
      newDecorations.push({
        range: new monaco.Range(
          warning.startLineNumber,
          warning.startColumn,
          warning.endLineNumber,
          warning.endColumn
        ),
        options: {
          className: 'squiggly-warning',
          glyphMarginClassName: 'warning-glyph',
          hoverMessage: { value: warning.message },
          overviewRuler: {
            color: { id: 'editorWarning.foreground' },
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      });
    });
    
    // Apply decorations
    if (editorInstance.current) {
      decorations.current = editorInstance.current.deltaDecorations(decorations.current, newDecorations);
    }
  }, []);

  // Toolbar actions
  const handleFind = useCallback(() => {
    editorInstance.current?.getAction('actions.find')?.run();
  }, []);

  const handleReplace = useCallback(() => {
    editorInstance.current?.getAction('editor.action.startFindReplaceAction')?.run();
  }, []);

  const handleFormat = useCallback(async () => {
    if (editorInstance.current) {
      try {
        await editorInstance.current.getAction('editor.action.formatDocument')?.run();
      } catch (error) {
        console.error('Error formatting document:', error);
      }
    }
  }, []);

  const toggleMinimap = useCallback(() => {
    const newValue = !isMinimapEnabled;
    setIsMinimapEnabled(newValue);
    editorInstance.current?.updateOptions({ minimap: { enabled: newValue } });
  }, [isMinimapEnabled]);

  const toggleFolding = useCallback(() => {
    const newValue = !isFoldingEnabled;
    setIsFoldingEnabled(newValue);
    editorInstance.current?.updateOptions({ folding: newValue });
  }, [isFoldingEnabled]);

  const toggleWordWrap = useCallback(() => {
    const newValue = !isWordWrapEnabled;
    setIsWordWrapEnabled(newValue);
    editorInstance.current?.updateOptions({ wordWrap: newValue ? 'on' : 'off' });
  }, [isWordWrapEnabled]);

  const toggleErrorPanel = useCallback(() => {
    setIsErrorPanelVisible(prev => !prev);
  }, []);

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLanguage = event.target.value as string;
    setCurrentLanguage(newLanguage);
    
    // If the editor has no content, set default content for the language
    const currentValue = editorInstance.current?.getValue();
    if (!currentValue || currentValue.trim() === '') {
      const langConfig = LANGUAGE_CONFIGS.find(lang => lang.id === newLanguage);
      if (langConfig?.defaultContent) {
        editorInstance.current?.setValue(langConfig.defaultContent);
      }
    }
  };
  
  const handleGoToLine = useCallback(() => {
    editorInstance.current?.getAction('editor.action.gotoLine')?.run();
  }, []);
  
  const handleToggleComment = useCallback(() => {
    editorInstance.current?.getAction('editor.action.commentLine')?.run();
  }, []);
  
  const handleUndo = useCallback(() => {
    editorInstance.current?.trigger('keyboard', 'undo', null);
  }, []);
  
  const handleRedo = useCallback(() => {
    editorInstance.current?.trigger('keyboard', 'redo', null);
  }, []);
  
  const handleZoomIn = useCallback(() => {
    editorInstance.current?.trigger('keyboard', 'editor.action.fontZoomIn', null);
  }, []);
  
  const handleZoomOut = useCallback(() => {
    editorInstance.current?.trigger('keyboard', 'editor.action.fontZoomOut', null);
  }, []);
  
  const handleZoomReset = useCallback(() => {
    editorInstance.current?.trigger('keyboard', 'editor.action.fontZoomReset', null);
  }, []);

  const handleLanguageChange = useCallback((event: SelectChangeEvent) => {
    const newLanguage = event.target.value as string;
    setCurrentLanguage(newLanguage);
    if (editorInstance.current) {
      const model = editorInstance.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
        
        // Set default content for the language if the current content is empty or default
        const currentContent = model.getValue();
        const languageConfig = LANGUAGE_CONFIGS.find(lang => lang.id === newLanguage);
        
        if ((!currentContent || currentContent.trim() === '') && languageConfig?.defaultContent) {
          model.setValue(languageConfig.defaultContent);
        }
      }
    }
  }, []);
  
  const handleErrorClick = useCallback((marker: monaco.editor.IMarker) => {
    if (editorInstance.current) {
      editorInstance.current.revealLineInCenter(marker.startLineNumber);
      editorInstance.current.setPosition({
        lineNumber: marker.startLineNumber,
        column: marker.startColumn,
      });
      editorInstance.current.focus();
    }
  }, []);

  // Render the editor with toolbar and status bar
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 p-2 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
        {/* Language Selector */}
        <FormControl size="small" variant="outlined" className="w-40">
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            inputProps={{
              name: 'language',
              id: 'language-selector',
            }}
          >
            {LANGUAGE_CONFIGS.map((lang) => (
              <MenuItem key={lang.id} value={lang.id}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

      {/* Error Panel */}
      {isErrorPanelVisible && (errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {errors.length > 0 && (
                <button 
                  onClick={() => handleErrorClick(errors[0])}
                  className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  <ErrorOutlineIcon fontSize="small" className="mr-1" />
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </button>
              )}
              {warnings.length > 0 && (
                <button 
                  onClick={() => warnings[0] && handleErrorClick(warnings[0])}
                  className="flex items-center text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                >
                  <WarningAmberIcon fontSize="small" className="mr-1" />
                  {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                </button>
              )}
              {infos.length > 0 && (
                <button 
                  onClick={() => infos[0] && handleErrorClick(infos[0])}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <InfoOutlinedIcon fontSize="small" className="mr-1" />
                  {infos.length} Info{infos.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
            <IconButton size="small" onClick={() => setIsErrorPanelVisible(false)}>
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="p-2 text-xs font-mono">
            {(errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
              <div className="space-y-1">
                {[...errors, ...warnings, ...infos]
                  .sort((a, b) => a.startLineNumber - b.startLineNumber || a.startColumn - b.startColumn)
                  .map((marker, index) => (
                    <div 
                      key={`${marker.startLineNumber}-${marker.startColumn}-${index}`}
                      className={`flex items-start p-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        marker.severity === monaco.MarkerSeverity.Error ? 'text-red-600 dark:text-red-400' : 
                        marker.severity === monaco.MarkerSeverity.Warning ? 'text-yellow-600 dark:text-yellow-400' : 
                        'text-blue-600 dark:text-blue-400'
                      }`}
                      onClick={() => handleErrorClick(marker)}
                    >
                      <span className="mr-2">
                        {marker.severity === monaco.MarkerSeverity.Error ? (
                          <ErrorOutlineIcon fontSize="small" />
                        ) : marker.severity === monaco.MarkerSeverity.Warning ? (
                          <WarningAmberIcon fontSize="small" />
                        ) : (
                          <InfoOutlinedIcon fontSize="small" />
                        )}
                      </span>
                      <span className="flex-1">
                        [{marker.startLineNumber}, {marker.startColumn}] {marker.message}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <div className="flex items-center space-x-4">
          {path && <span>{path}</span>}
          <span>{currentLanguage.toUpperCase()}</span>
          {currentUserCursor && (
            <span>
              Ln {currentUserCursor.lineNumber}, Col {currentUserCursor.column}
            </span>
          )}
          {currentUserSelection && !currentUserSelection.isEmpty() && (
            <span>
              {Math.abs(currentUserSelection.endLineNumber - currentUserSelection.startLineNumber + 1)} lines selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {errors.length > 0 && (
            <button 
              onClick={() => setIsErrorPanelVisible(!isErrorPanelVisible)}
              className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title={`${errors.length} error${errors.length !== 1 ? 's' : ''}`}
            >
              <ErrorOutlineIcon fontSize="small" className="mr-1" />
              {errors.length}
            </button>
          )}
          {warnings.length > 0 && (
            <button 
              onClick={() => setIsErrorPanelVisible(!isErrorPanelVisible)}
              className="flex items-center text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
              title={`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
            >
              <WarningAmberIcon fontSize="small" className="mr-1" />
              {warnings.length}
            </button>
          )}
          {infos.length > 0 && (
            <button 
              onClick={() => setIsErrorPanelVisible(!isErrorPanelVisible)}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              title={`${infos.length} info${infos.length !== 1 ? 's' : ''}`}
            >
              <InfoOutlinedIcon fontSize="small" className="mr-1" />
              {infos.length}
            </button>
          )}
          {users.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="flex -space-x-1">
                {users.slice(0, 3).map((user) => (
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
              <span>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonacoEditor;
