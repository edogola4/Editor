import { useEditorStore } from '../store/editorStore'

interface StatusBarProps {
  showDetailed?: boolean
}

export const StatusBar = ({ showDetailed = false }: StatusBarProps) => {
  const { language, cursorPositions } = useEditorStore()

  const getLanguageDisplayName = (lang: string) => {
    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      ruby: 'Ruby',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
    }
    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
  }

  if (!showDetailed) {
    // Compact status bar
    return (
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-300">
        <div className="flex items-center space-x-4">
          <span className="text-green-400">●</span>
          <span>Ready</span>
          <span>•</span>
          <span>{getLanguageDisplayName(language)}</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          {Object.keys(cursorPositions).length > 0 && (
            <>
              <span>{Object.keys(cursorPositions).length} cursor{Object.keys(cursorPositions).length !== 1 ? 's' : ''}</span>
              <span>•</span>
            </>
          )}
          <span>Connected</span>
        </div>
      </div>
    )
  }

  // Detailed status bar
  return (
    <div className="bg-gray-800 border-t border-gray-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm">Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Language:</span>
            <span className="text-white text-sm font-medium">
              {getLanguageDisplayName(language)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Encoding:</span>
            <span className="text-white text-sm">UTF-8</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Cursors:</span>
            <span className="text-white text-sm font-medium">
              {Object.keys(cursorPositions).length + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Status:</span>
            <span className="text-green-400 text-sm font-medium">Connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
