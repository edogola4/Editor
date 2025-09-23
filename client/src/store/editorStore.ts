import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface EditorState {
  code: string
  language: string
  theme: string
  connectedUsers: string[]
  cursorPositions: Record<string, { line: number; column: number }>
}

interface EditorActions {
  setCode: (code: string) => void
  setLanguage: (language: string) => void
  setTheme: (theme: string) => void
  addConnectedUser: (userId: string) => void
  removeConnectedUser: (userId: string) => void
  updateCursorPosition: (userId: string, position: { line: number; column: number }) => void
}

export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set) => ({
    code: `// Welcome to the Collaborative Code Editor!
// Start typing your code here...

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // Output: 55
`,
    language: 'javascript',
    theme: 'vs-dark',
    connectedUsers: [],
    cursorPositions: {},

    setCode: (code) =>
      set((state) => {
        state.code = code
      }),

    setLanguage: (language) =>
      set((state) => {
        state.language = language
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme
      }),

    addConnectedUser: (userId) =>
      set((state) => {
        if (!state.connectedUsers.includes(userId)) {
          state.connectedUsers.push(userId)
        }
      }),

    removeConnectedUser: (userId) =>
      set((state) => {
        state.connectedUsers = state.connectedUsers.filter(id => id !== userId)
        delete state.cursorPositions[userId]
      }),

    updateCursorPosition: (userId, position) =>
      set((state) => {
        state.cursorPositions[userId] = position
      }),
  }))
)
