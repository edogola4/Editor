import { useEditorStore } from '../store/editorStore'
import { GitBranch, Users, Zap, Globe } from 'lucide-react'

interface StatusBarProps {
  showDetailed?: boolean
}

export const StatusBar = ({ showDetailed = false }: StatusBarProps) => {
  const { language, cursorPositions, connectedUsers, documentId } = useEditorStore()

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
      sql: 'SQL'
    }
    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
  }

  if (!showDetailed) {
    // Compact status bar
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-green-400" />
            <span className="text-gray-300">Live</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe size={14} className="text-blue-400" />
            <span className="text-gray-300">{getLanguageDisplayName(language)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <GitBranch size={14} className="text-gray-400" />
            <span className="text-gray-400">main</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {Object.keys(cursorPositions).length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                <Users size={14} className="text-purple-400" />
                <span className="text-gray-300">{Object.keys(cursorPositions).length} active</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400">Connected</span>
          </div>
        </div>
      </div>
    )
  }

  // Detailed status bar
  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-white text-sm font-medium">Live Session</span>
            </div>
            <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
              {documentId ? documentId.slice(0, 12) + '...' : 'No Session'}
            </div>
          </div>

          {/* Language Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Globe size={16} className="text-blue-400" />
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

          {/* Git Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <GitBranch size={16} className="text-gray-400" />
              <span className="text-gray-400 text-sm">Branch:</span>
              <span className="text-white text-sm font-medium">main</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Status:</span>
              <span className="text-green-400 text-sm font-medium">Clean</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-8">
          {/* Cursor Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-purple-400" />
              <span className="text-gray-400 text-sm">Cursors:</span>
              <span className="text-white text-sm font-medium">
                {Object.keys(cursorPositions).length + 1}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Users:</span>
              <span className="text-white text-sm font-medium">
                {connectedUsers.length + 1}
              </span>
            </div>
          </div>

          {/* Performance */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-400 text-sm">Memory:</span>
              <span className="text-white text-sm">24 MB</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Latency:</span>
              <span className="text-green-400 text-sm font-medium">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
