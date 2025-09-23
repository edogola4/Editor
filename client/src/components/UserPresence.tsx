import { useEditorStore } from '../store/editorStore'

interface UserPresenceProps {
  showDetails?: boolean
}

export const UserPresence = ({ showDetails = false }: UserPresenceProps) => {
  const { connectedUsers, cursorPositions } = useEditorStore()

  // Color palette for different users
  const userColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ]

  const getUserColor = (index: number) => userColors[index % userColors.length]

  if (!showDetails) {
    // Compact view
    return (
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-1">
          {connectedUsers.slice(0, 3).map((userId, index) => (
            <div
              key={userId}
              className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: getUserColor(index) }}
              title={`User ${userId.slice(0, 8)}`}
            >
              {userId.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {connectedUsers.length > 3 && (
            <div className="w-6 h-6 bg-gray-700 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium">
              +{connectedUsers.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-300">
          {connectedUsers.length + 1} user{connectedUsers.length !== 0 ? 's' : ''} online
        </span>
      </div>
    )
  }

  // Detailed view
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-3">Connected Users</h3>
      <div className="space-y-2">
        {connectedUsers.map((userId, index) => {
          const color = getUserColor(index)
          const position = cursorPositions[userId]
          const isActive = !!position

          return (
            <div
              key={userId}
              className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                isActive ? 'bg-gray-700' : 'bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2 flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: color }}
                >
                  {userId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">
                    User {userId.slice(0, 8)}
                  </div>
                  {isActive && (
                    <div className="text-gray-400 text-xs">
                      Line {position.line}, Column {position.column}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {isActive ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>
          )
        })}

        {connectedUsers.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-4">
            No other users connected
          </div>
        )}
      </div>
    </div>
  )
}
