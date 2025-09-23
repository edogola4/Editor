import React, { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../utils/socket'

interface CodeEditorProps {
  height?: string
}

export const CodeEditor = ({ height = '100vh' }: CodeEditorProps) => {
  const editorRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const { code, language, theme, connectedUsers, cursorPositions, typingUsers, documentId } = useEditorStore()
  const { emitCodeChange, emitLanguageChange, emitCursorUpdate, emitTypingStart, emitTypingStop, joinDocument } = useSocket()
  const { user } = useAuthStore()

  const userId = user?.id || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const userColor = useRef(`#${Math.floor(Math.random()*16777215).toString(16)}`).current

  // Connect to socket when user is authenticated or use generated userId
  useEffect(() => {
    const socket = useSocket().socket
    if (socket) {
      const authData = user
        ? { userId: user.id, username: user.username }
        : { userId, username: userId.slice(0, 8) }
      socket.auth = authData
      socket.connect(userId, documentId)
    }
  }, [user, userId, documentId])

  // Join document room when documentId changes
  useEffect(() => {
    if (documentId && documentId !== 'default') {
      joinDocument(documentId)
    }
  }, [documentId])

  // Color palette for different users
  const userColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ]

  const getUserColor = (index: number) => userColors[index % userColors.length]

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor

    // Connect to socket with user authentication
    const socket = useSocket().socket
    if (socket) {
      const authData = user
        ? { userId: user.id, username: user.username }
        : { userId, username: userId.slice(0, 8) }
      socket.auth = authData
      socket.connect(userId, documentId)
    }

    // Focus the editor
    editor.focus()

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      const position = {
        line: e.position.lineNumber,
        column: e.position.column
      }
      emitCursorUpdate(userId, position)
    })

    // Handle selection changes
    editor.onDidChangeCursorSelection((e: any) => {
      const position = {
        line: e.selection.endLineNumber,
        column: e.selection.endColumn
      }
      emitCursorUpdate(userId, position)
    })

    // Handle content changes with typing indicators
    let typingTimer: NodeJS.Timeout
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()

      // Start typing indicator
      emitTypingStart(documentId)

      // Update code in store
      useEditorStore.getState().setCode(value)
      emitCodeChange(value, documentId)

      // Clear previous timer
      clearTimeout(typingTimer)

      // Stop typing indicator after 1 second of inactivity
      typingTimer = setTimeout(() => {
        emitTypingStop(documentId)
      }, 1000)
    })

    // Handle language changes
    editor.onDidChangeModelLanguage((e: any) => {
      const newLanguage = e.newLanguage
      useEditorStore.getState().setLanguage(newLanguage)
      emitLanguageChange(newLanguage, documentId)
    })

    // Setup remote cursors
    updateRemoteCursors()
  }

  const updateRemoteCursors = () => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const decorations = []

    Object.entries(cursorPositions).forEach(([otherUserId, position], index) => {
      if (otherUserId !== userId) {
        const color = getUserColor(index)

        // Create cursor decoration
        const cursorDecoration = {
          range: new (window as any).monaco.Range(position.line, position.column, position.line, position.column),
          options: {
            className: 'remote-cursor',
            stickiness: (window as any).monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            afterContentClassName: 'remote-cursor-label',
            after: {
              content: ` ${otherUserId.slice(0, 8)}`,
              inlineClassName: 'remote-cursor-label',
              backgroundColor: color
            }
          }
        }

        decorations.push(cursorDecoration)
      }
    })

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations)
  }

  // Update remote cursors when cursor positions change
  useEffect(() => {
    updateRemoteCursors()
  }, [cursorPositions, userId])

  const handleLanguageChange = (newLanguage: string) => {
    useEditorStore.getState().setLanguage(newLanguage)
    emitLanguageChange(newLanguage, documentId)
  }

  return (
    <div className="h-full w-full relative group">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-gray-800/90 backdrop-blur-sm text-white text-sm rounded-lg px-3 py-2 border border-gray-600/50 focus:border-blue-500 focus:outline-none shadow-lg"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="sql">SQL</option>
          <option value="yaml">YAML</option>
        </select>
      </div>

      {/* Monaco Editor */}
      <Editor
        height={height}
        language={language}
        theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
        value={code}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 16,
          fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
          fontLigatures: true,
          lineHeight: 1.6,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          renderLineHighlight: 'line',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: {
            other: 'on',
            comments: 'on',
            strings: 'on',
          },
          parameterHints: { enabled: true },
          hover: { enabled: true },
          contextmenu: true,
          mouseWheelZoom: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderLineHighlightOnlyWhenFocus: false,
          selectionHighlight: true,
          occurrencesHighlight: true,
          codeLens: true,
          lightbulb: { enabled: true },
          inlayHints: { enabled: true }
        }}
      />

      {/* Custom CSS for remote cursors */}
      <style>{`
        .remote-cursor {
          position: relative;
          border-left: 3px solid var(--cursor-color);
          background: rgba(255, 255, 255, 0.1);
          animation: cursor-pulse 2s ease-in-out infinite;
        }

        .remote-cursor-label {
          position: absolute;
          top: -20px;
          left: 2px;
          white-space: nowrap;
          z-index: 1000;
          font-family: var(--vscode-font-family);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          color: white;
          border: 2px solid var(--cursor-color);
          background: var(--cursor-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          animation: label-fade-in 0.3s ease-out;
        }

        @keyframes cursor-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes label-fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .monaco-editor .margin {
          background: rgba(30, 30, 30, 0.3);
        }

        .monaco-editor .minimap {
          background: rgba(0, 0, 0, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .monaco-editor .minimap-slider {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Typing indicators overlay */}
      <div className="absolute bottom-4 left-4 flex space-x-3">
        {Object.entries(typingUsers).some(([_, isTyping]) => isTyping) && (
          <div className="bg-gray-800/90 backdrop-blur-sm text-gray-300 text-xs px-3 py-2 rounded-lg border border-gray-600/50 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>
                {Object.entries(typingUsers)
                  .filter(([_, isTyping]) => isTyping)
                  .map(([userId]) => userId.slice(0, 8))
                  .join(', ')} typing...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
