import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../contexts/CollaborationContext';
import { FiUser, FiWifi, FiWifiOff, FiMaximize2, FiMinimize2, FiUsers } from 'react-icons/fi';

interface UserPresenceListProps {
  users: User[];
  currentUserId: string;
  className?: string;
  onUserClick?: (userId: string) => void;
}

const UserPresenceList: React.FC<UserPresenceListProps> = ({
  users,
  currentUserId,
  className = '',
  onUserClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  // Sort users with current user first, then sort by name
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, currentUserId]);

  // Group users by their status
  const { onlineUsers, offlineUsers } = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        if (user.status === 'offline') {
          acc.offlineUsers.push(user);
        } else {
          acc.onlineUsers.push(user);
        }
        return acc;
      },
      { onlineUsers: [] as User[], offlineUsers: [] as User[] }
    );
  }, [users]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Auto-close after delay if not pinned
    if (isExpanded && !isPinned) {
      setTimeout(() => setIsHovered(false), 300);
    }
  };

  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId);
    }
  };

  // If there's only one user (current user) and not pinned, don't show
  if (users.length <= 1 && !isPinned) return null;

  return (
    <motion.div
      className={`fixed right-4 bottom-4 z-50 flex flex-col items-end ${className}`}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && isExpanded && setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Collapsed state */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-2 flex items-center space-x-2 cursor-pointer" onClick={toggleExpand}>
              <div className="relative">
                <FiUsers className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {onlineUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-white text-xxs flex items-center justify-center">
                    {onlineUsers.length}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {onlineUsers.length} online
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded state */}
      <AnimatePresence>
        {(isExpanded || isHovered) && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden w-64"
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              height: 'auto',
              y: 0,
              transition: { 
                height: { type: 'spring', damping: 25, stiffness: 300 },
                opacity: { duration: 0.2 }
              }
            }}
            exit={{ 
              opacity: 0, 
              height: 0,
              y: 20,
              transition: { 
                height: { type: 'spring', damping: 30, stiffness: 500 },
                opacity: { duration: 0.2 }
              }
            }}
          >
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <FiUsers className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  People ({onlineUsers.length} online)
                </h3>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  title={isPinned ? 'Unpin' : 'Pin'}
                >
                  {isPinned ? (
                    <FiMaximize2 className="w-4 h-4" />
                  ) : (
                    <FiMinimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={toggleExpand}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  title="Collapse"
                >
                  <FiMinimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Online users */}
            <div className="max-h-80 overflow-y-auto">
              {onlineUsers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sortedUsers
                    .filter(user => user.status !== 'offline')
                    .map(user => (
                      <UserItem
                        key={user.id}
                        user={user}
                        isCurrentUser={user.id === currentUserId}
                        isOnline={true}
                        onClick={() => handleUserClick(user.id)}
                      />
                    ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No one else is here
                </div>
              )}

              {/* Offline users (only show if expanded) */}
              {offlineUsers.length > 0 && isExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Offline
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {offlineUsers.map(user => (
                      <UserItem
                        key={user.id}
                        user={user}
                        isCurrentUser={user.id === currentUserId}
                        isOnline={false}
                        onClick={() => handleUserClick(user.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface UserItemProps {
  user: User;
  isCurrentUser: boolean;
  isOnline: boolean;
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, isCurrentUser, isOnline, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`px-3 py-2 flex items-center space-x-3 cursor-pointer transition-colors ${
        isHovered ? 'bg-gray-50 dark:bg-gray-750' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: user.color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.name}
          </span>
          {isCurrentUser && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          {isOnline ? (
            <>
              <FiWifi className="w-3 h-3 mr-1 text-green-500" />
              <span>Online</span>
            </>
          ) : (
            <>
              <FiWifiOff className="w-3 h-3 mr-1 text-gray-400" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
      {user.cursorPosition && isOnline && (
        <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Ln {user.cursorPosition.lineNumber}, Col {user.cursorPosition.column}
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(UserPresenceList);
