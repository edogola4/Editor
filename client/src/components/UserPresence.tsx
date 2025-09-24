import React from 'react';
import { Users, MessageCircle, Eye } from 'lucide-react';
import type { UserPresenceProps } from '../types';
import Avatar from './ui/Avatar';

export const UserPresence: React.FC<UserPresenceProps> = ({
  users,
  showDetails = false,
  compact = false,
  maxAvatars = 5
}) => {
  const onlineUsers = users.filter(user => user.connectionStatus === 'online');
  const activeUsers = users.filter(user => user.isTyping || user.cursor);


  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            {onlineUsers.length + 1} online
          </span>
        </div>

        <div className="flex -space-x-2">
          {onlineUsers.slice(0, maxAvatars).map((user) => (
            <Avatar
              key={user.id}
              name={user.name}
              size="sm"
              status={user.connectionStatus}
              showStatus={true}
              className="ring-2 ring-slate-800"
            />
          ))}
          {onlineUsers.length > maxAvatars && (
            <div className="w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium">
              +{onlineUsers.length - maxAvatars}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/30 rounded-full">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            {onlineUsers.length + 1} viewing
          </span>
        </div>

        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <Avatar
              key={user.id}
              name={user.name}
              size="sm"
              status={user.connectionStatus}
              showStatus={true}
              className="ring-2 ring-slate-800 hover:scale-110 transition-transform duration-200"
            />
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium hover:scale-110 transition-transform duration-200">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>

        {activeUsers.length > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-blue-400">
              {activeUsers.length} active
            </span>
          </div>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Collaborators</span>
        </h3>
        <div className="text-sm text-slate-400">
          {onlineUsers.length + 1} total
        </div>
      </div>

      <div className="space-y-3">
        {/* Current user */}
        <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Avatar
            name="You"
            size="md"
            status="online"
            showStatus={true}
          />
          <div className="flex-1">
            <div className="text-white font-medium">You</div>
            <div className="text-sm text-slate-400">Current session</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        {/* Other users */}
        {onlineUsers.map((user) => {
          const isTyping = user.isTyping;
          const hasCursor = !!user.cursor;

          return (
            <div
              key={user.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isTyping || hasCursor
                  ? 'bg-slate-700/30 border border-slate-600/30'
                  : 'bg-slate-800/50 hover:bg-slate-700/30'
              }`}
            >
              <Avatar
                name={user.name}
                size="md"
                status={user.connectionStatus}
                showStatus={true}
              />

              <div className="flex-1">
                <div className="text-white font-medium">{user.name}</div>

                {isTyping && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-slate-400">typing...</span>
                  </div>
                )}

                {hasCursor && !isTyping && (
                  <div className="text-sm text-slate-400">
                    Line {user.cursor.line}, Column {user.cursor.column}
                  </div>
                )}

                {user.lastSeen && (
                  <div className="text-xs text-slate-500">
                    Last seen {new Date(user.lastSeen).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {isTyping && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
                {hasCursor && !isTyping && (
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                )}

                <span className={`text-xs px-2 py-1 rounded-full ${
                  isTyping ? 'bg-blue-600/50 text-blue-300' :
                  hasCursor ? 'bg-emerald-600/50 text-emerald-300' :
                  'bg-slate-600/50 text-slate-400'
                }`}>
                  {isTyping ? 'Typing' : hasCursor ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>
          );
        })}

        {onlineUsers.length === 0 && (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No collaborators online</p>
            <p className="text-slate-500 text-xs mt-1">Share this session to invite others</p>
          </div>
        )}
      </div>
    </div>
  );
};
