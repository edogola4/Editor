import React from 'react'
import { useEditorStore } from '../store/editorStore'

interface UserPresenceProps {
  showDetails?: boolean
}

export const UserPresence = ({ showDetails = false }: UserPresenceProps) => {
  const { connectedUsers } = useEditorStore()

  if (!showDetails) {
    // Compact view for header
    return (
      <div className="flex items-center space-x-3">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className="status-indicator status-online"></div>
          <span className="text-sm text-gray-300">
            {connectedUsers.length + 1} user{connectedUsers.length + 1 !== 1 ? 's' : ''} online
          </span>
        </div>

        {/* Connected Users Avatars */}
        <div className="flex items-center -space-x-2">
          {/* Current user avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-sm font-medium shadow-lg">
            You
          </div>

          {/* Other users avatars */}
          {connectedUsers.slice(0, 3).map((userId, index) => (
            <div
              key={userId}
              className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium shadow-lg animate-scale-in"
              style={{
                animationDelay: `${index * 100}ms`,
                zIndex: 10 - index
              }}
              title={userId.slice(0, 8)}
            >
              {userId.slice(0, 2).toUpperCase()}
            </div>
          ))}

          {/* More users indicator */}
          {connectedUsers.length > 3 && (
            <div className="w-8 h-8 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium shadow-lg">
              +{connectedUsers.length - 3}
            </div>
          )}
        </div>

        {/* Collaboration Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Live</span>
        </div>
      </div>
    )
  }

  // Detailed view for status bar or panels
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
        <div className="status-indicator status-online"></div>
        <span>Connected Users</span>
      </h3>
      <div className="space-y-2">
        {/* Current user */}
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            You
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">You (Current Session)</div>
            <div className="text-blue-400 text-xs">Active</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
              Online
            </span>
          </div>
        </div>

        {/* Other connected users */}
        {connectedUsers.map((userId, index) => (
          <div key={userId} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/30 transition-colors hover:bg-gray-700/50">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {userId.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">
                User {userId.slice(0, 8)}
              </div>
              <div className="text-gray-400 text-xs">Connected</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                Active
              </span>
            </div>
          </div>
        ))}

        {connectedUsers.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-4">
            No other users connected
          </div>
        )}
      </div>
    </div>
  )
}
