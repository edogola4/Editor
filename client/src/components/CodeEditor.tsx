import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useEditorStore } from '../store/editorStore'
import { useSocket } from '../utils/socket'
import { useAuthStore } from '../store/authStore'
import { nanoid } from 'nanoid'

interface CodeEditorProps {
  height?: string
}

export const CodeEditor = ({ height = '100vh' }: CodeEditorProps) => {
  const editorRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  const { code, language, theme, connectedUsers, cursorPositions, typingUsers, documentId } = useEditorStore()
  const { emitCodeChange, emitLanguageChange, emitCursorUpdate, emitTypingStart, emitTypingStop, joinDocument } = useSocket()
  const { user } = useAuthStore()

  const userId = user?.id || 'anonymous'
  const userColor = useRef(`#${Math.floor(Math.random()*16777215).toString(16)}`).current

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user) {
      const socket = useSocket().socket
      if (socket) {
        socket.auth = { userId: user.id, username: user.username }
        socket.connect(userId, documentId)
      }
    }
  }, [user, documentId])

  // Join document room when documentId changes
  useEffect(() => {
    if (documentId && user) {
      joinDocument(documentId)
    }
  }, [documentId, user])

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
    if (socket && user) {
      socket.auth = { userId: user.id, username: user.username }
      socket.connect(userId, documentId)
    }

    // Focus the editor
    editor.focus()

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      const position = {
        line: e.position.lineNumber,
        column: e.position.column,
      }
      emitCursorUpdate(position, documentId)
    })

    // Handle typing indicators
    let typingTimer: NodeJS.Timeout
    editor.onDidChangeModelContent(() => {
      // Start typing indicator
      emitTypingStart(documentId)

      // Clear previous timer
      clearTimeout(typingTimer)

      // Stop typing indicator after 1 second of inactivity
      typingTimer = setTimeout(() => {
        emitTypingStop(documentId)
      }, 1000)
    })

    // Handle selection changes for collaborative cursors
    editor.onDidChangeCursorSelection((e: any) => {
      if (!e.selection.isEmpty()) {
        // Could emit selection change here for collaborative selection
      }
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      useEditorStore.getState().setCode(value)
      emitCodeChange(value, documentId)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    useEditorStore.getState().setLanguage(newLanguage)
    emitLanguageChange(newLanguage, documentId)
  }

  // Update decorations for remote cursors
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current
      const newDecorations: any[] = []

      Object.entries(cursorPositions).forEach(([remoteUserId, position], index) => {
        if (remoteUserId !== userId) {
          const color = getUserColor(index)

          newDecorations.push({
            range: new (window as any).monaco.Range(
              position.line,
              position.column,
              position.line,
              position.column
            ),
            options: {
              className: 'remote-cursor',
              stickiness: (window as any).monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              afterContentClassName: `remote-cursor-label-${index}`,
              after: {
                content: ` ${remoteUserId.slice(0, 8)}`,
                inlineClassName: `remote-cursor-label remote-cursor-label-${index}`,
                backgroundColor: color,
                color: '#ffffff',
                border: `2px solid ${color}`,
                margin: '0 0 0 -1px',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
              }
            }
          })
        }
      })

      // Clear previous decorations and add new ones
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
    }
  }, [cursorPositions, userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const socket = useSocket().socket
      if (socket) {
        emitTypingStop(documentId)
        socket.disconnect()
      }
    }
  }, [documentId])

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm font-medium">Language:</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1 bg-gray-700 text-white border border-gray-600 rounded text-sm"
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
            <option value="yaml">YAML</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-white text-sm">
            Connected Users: {connectedUsers.length + 1}
          </div>
          <div className="flex -space-x-2">
            {connectedUsers.slice(0, 5).map((userId, index) => (
              <div
                key={userId}
                className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: getUserColor(index) }}
                title={`User ${userId.slice(0, 8)}`}
              >
                {userId.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {connectedUsers.length > 5 && (
              <div className="w-6 h-6 bg-gray-700 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium">
                +{connectedUsers.length - 5}
              </div>
            )}
          </div>
          {/* Typing indicators */}
          {Object.entries(typingUsers).some(([_, isTyping]) => isTyping) && (
            <div className="text-gray-400 text-xs">
              {Object.entries(typingUsers)
                .filter(([_, isTyping]) => isTyping)
                .map(([userId]) => userId.slice(0, 8))
                .join(', ')} typing...
            </div>
          )}
        </div>
      </div>

      <Editor
        height={height}
        language={language}
        theme={theme}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'Fira Code, Consolas, Monaco, Courier New, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: true,
          selectOnLineNumbers: true,
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            enabled: true,
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: 'on',
            comments: 'on',
            strings: 'on',
          },
        }}
      />

      {/* Custom CSS for remote cursors */}
      <style>{`
        .remote-cursor {
          position: relative;
          border-left: 2px solid;
          border-color: var(--cursor-color);
        }

        .remote-cursor-label {
          position: absolute;
          top: -20px;
          left: 0;
          white-space: nowrap;
          z-index: 1000;
          font-family: var(--vscode-font-family);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 3px;
          color: white;
          border: 2px solid var(--cursor-color);
        }
      `}</style>
    </div>
  )
}
