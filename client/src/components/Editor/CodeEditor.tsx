import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { CursorPosition, SelectionRange } from '../../types/editor.types';
import './CodeEditor.css';

interface CodeEditorProps {
  documentId: string;
  userId: string;
  username: string;
  language?: string;
  theme?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  documentId,
  userId,
  username,
  language = 'javascript',
  theme = 'default',
}) => {
  const {
    content,
    setContent,
    cursorPosition,
    setCursorPosition,
    selection,
    setSelection,
    users,
    connect,
    disconnect,
    isConnected,
  } = useEditor();

  const editorRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<any>(null);

  // Connect to the document when the component mounts
  useEffect(() => {
    connect(documentId, username);
    return () => {
      disconnect();
    };
  }, [connect, disconnect, documentId, username]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || codeMirrorRef.current) return;

    import('codemirror').then(CodeMirror => {
      import('codemirror/mode/javascript/javascript');
      import('codemirror/addon/edit/matchbrackets');
      import('codemirror/addon/edit/closebrackets');
      import('codemirror/addon/selection/active-line');
      import('codemirror/theme/monokai.css');

      const editor = CodeMirror(editorRef.current!, {
        value: content,
        mode: language,
        theme: theme,
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
      });

      editor.on('change', (cm) => {
        setContent(cm.getValue());
      });

      editor.on('cursorActivity', (cm) => {
        const cursor = cm.getCursor();
        setCursorPosition({
          line: cursor.line,
          ch: cursor.ch,
          sticky: cursor.sticky,
        });

        const sel = cm.listSelections()[0];
        if (sel) {
          setSelection({
            anchor: { line: sel.anchor.line, ch: sel.anchor.ch },
            head: { line: sel.head.line, ch: sel.head.ch },
          });
        }
      });

      codeMirrorRef.current = editor;

      // Set up custom cursor rendering for other users
      const cursorMap = new Map();
      
      const renderCursors = () => {
        // Clear existing cursors
        cursorMap.forEach((cursorEl) => cursorEl.remove());
        cursorMap.clear();

        // Render cursors for other users
        Object.entries(users).forEach(([id, user]) => {
          if (id === userId || !user.cursor) return;

          const coords = editor.cursorCoords(
            { line: user.cursor.line, ch: user.cursor.ch },
            'page'
          );

          let cursorEl = cursorMap.get(id);
          if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.className = 'remote-cursor';
            cursorEl.style.borderLeftColor = user.color;
            
            const nameTag = document.createElement('div');
            nameTag.className = 'remote-cursor-name';
            nameTag.style.backgroundColor = user.color;
            nameTag.textContent = user.username || `User ${id.slice(0, 6)}`;
            
            cursorEl.appendChild(nameTag);
            document.body.appendChild(cursorEl);
            cursorMap.set(id, cursorEl);
          }

          cursorEl.style.left = `${coords.left}px`;
          cursorEl.style.top = `${coords.top}px`;
        });

        requestAnimationFrame(renderCursors);
      };

      renderCursors();
    });

    return () => {
      if (codeMirrorRef.current) {
        codeMirrorRef.current.off('change');
        codeMirrorRef.current.off('cursorActivity');
        codeMirrorRef.current.toTextArea();
        codeMirrorRef.current = null;
      }
    };
  }, [language, theme, userId, users]);

  // Update editor content when it changes remotely
  useEffect(() => {
    if (codeMirrorRef.current && codeMirrorRef.current.getValue() !== content) {
      const cursor = codeMirrorRef.current.getCursor();
      codeMirrorRef.current.setValue(content);
      codeMirrorRef.current.setCursor(cursor);
    }
  }, [content]);

  // Update editor options when language or theme changes
  useEffect(() => {
    if (codeMirrorRef.current) {
      codeMirrorRef.current.setOption('mode', language);
    }
  }, [language]);

  useEffect(() => {
    if (codeMirrorRef.current) {
      codeMirrorRef.current.setOption('theme', theme);
    }
  }, [theme]);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="document-info">
          Document: {documentId} | Users: {Object.keys(users).length}
        </div>
      </div>
      <div className="code-editor" ref={editorRef} />
      <div className="user-presence">
        {Object.entries(users).map(([id, user]) => (
          <div key={id} className="user-badge" style={{ borderColor: user.color }}>
            <span className="user-avatar" style={{ backgroundColor: user.color }}>
              {(user.username || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="username">{user.username || `User ${id.slice(0, 6)}`}</span>
            {user.cursor && (
              <span className="cursor-position">
                {user.cursor.line + 1}:{user.cursor.ch + 1}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeEditor;
