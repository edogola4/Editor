import React, { useMemo } from 'react';
import type { UserPresence } from '../types';

interface CollaborativeCursorProps {
  user: UserPresence;
  isCurrentUser?: boolean;
}

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  user,
  isCurrentUser = false
}) => {
  const cursorStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: `${user.cursor.column * 8.5}px`, // Approximate character width
    top: `${user.cursor.line * 21}px`, // Approximate line height
    zIndex: isCurrentUser ? 100 : 50,
    pointerEvents: 'none' as const,
  }));

  const labelStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: `${user.cursor.column * 8.5 + 8}px`,
    top: `${user.cursor.line * 21 - 24}px`,
    backgroundColor: user.color,
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
    border: `2px solid ${user.color}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transform: 'translateY(-100%)',
    zIndex: isCurrentUser ? 101 : 51,
  }));

  return (
    <div style={cursorStyle}>
      {/* Cursor line */}
      <div
        className={`collaborative-cursor ${isCurrentUser ? 'current-user-cursor' : 'remote-cursor'}`}
        style={{
          width: '2px',
          height: '20px',
          backgroundColor: user.color,
          position: 'absolute',
          borderRadius: '1px',
          animation: isCurrentUser ? 'cursor-blink 1s infinite' : 'remote-cursor-pulse 2s ease-in-out infinite',
        }}
      />

      {/* User label */}
      <div style={labelStyle} className="user-label">
        <div className="flex items-center space-x-1">
          <div
            className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: user.color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span>{user.name}</span>
          {user.isTyping && (
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
              <div className="w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

interface CollaborativeCursorsProps {
  users: UserPresence[];
  currentUserId?: string;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  users,
  currentUserId
}) => {
  const activeUsers = users.filter(user => user.cursor && user.connectionStatus === 'online');

  return (
    <>
      {activeUsers.map(user => (
        <CollaborativeCursor
          key={user.id}
          user={user}
          isCurrentUser={user.id === currentUserId}
        />
      ))}

      
    </>
  );
};
