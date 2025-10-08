import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

interface PresenceListProps {
  users: User[];
  currentUserId: string;
  onUserClick?: (userId: string) => void;
}

export const PresenceList: React.FC<PresenceListProps> = ({
  users,
  currentUserId,
  onUserClick,
}) => {
  const onlineUsers = users.filter((user) => user.isOnline);
  const offlineUsers = users.filter((user) => !user.isOnline);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderUser = (user: User) => {
    const isCurrentUser = user.id === currentUserId;
    const displayName = isCurrentUser ? 'You' : user.name;

    return (
      <motion.div
        key={user.id}
        className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
          isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/30' : ''
        }`}
        onClick={() => onUserClick?.(user.id)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -10 }}
        layout
      >
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs"
              style={{ backgroundColor: user.color }}
            >
              {getUserInitials(user.name)}
            </div>
          )}
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
        <div className="ml-3 overflow-hidden">
          <div className="flex items-center">
            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {displayName}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                (you)
              </span>
            )}
          </div>
          {user.isTyping ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="inline-flex space-x-0.5 mr-1">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                <span
                  className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                ></span>
                <span
                  className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                ></span>
              </span>
              typing...
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.isOnline
                ? 'Online'
                : `Last seen ${user.lastSeen?.toLocaleTimeString()}`}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
      <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-4">
        Online ({onlineUsers.length})
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {onlineUsers.map((user) => (
            <React.Fragment key={user.id}>{renderUser(user)}</React.Fragment>
          ))}
        </AnimatePresence>
      </div>

      {offlineUsers.length > 0 && (
        <>
          <h3 className="font-medium text-gray-700 dark:text-gray-200 mt-6 mb-4">
            Offline ({offlineUsers.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto opacity-70">
            <AnimatePresence>
              {offlineUsers.map((user) => (
                <React.Fragment key={user.id}>
                  {renderUser(user)}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};
