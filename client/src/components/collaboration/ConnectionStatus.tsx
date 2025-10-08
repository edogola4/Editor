import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  lastSynced?: Date;
  onReconnect?: () => void;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  lastSynced,
  onReconnect,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState('');

  // Update last synced text
  useEffect(() => {
    if (!lastSynced) {
      setLastSyncedText('Never synced');
      return;
    }

    const updateLastSyncedText = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastSynced.getTime()) / 1000);
      
      if (diffInSeconds < 5) {
        setLastSyncedText('Just now');
      } else if (diffInSeconds < 60) {
        setLastSyncedText(`${diffInSeconds} seconds ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setLastSyncedText(`${minutes} minute${minutes === 1 ? '' : 's'} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setLastSyncedText(`${hours} hour${hours === 1 ? '' : 's'} ago`);
      } else {
        setLastSyncedText(lastSynced.toLocaleString());
      }
    };

    updateLastSyncedText();
    const interval = setInterval(updateLastSyncedText, 1000 * 30); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSynced]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <FiWifi className="w-4 h-4" />,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: <FiRefreshCw className="w-4 h-4 animate-spin" />,
          text: status === 'connecting' ? 'Connecting...' : 'Reconnecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="w-4 h-4" />,
          text: 'Connection error',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'disconnected':
      default:
        return {
          icon: <FiWifiOff className="w-4 h-4" />,
          text: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
    }
  };

  const { icon, text, color, bgColor, borderColor } = getStatusConfig();
  const isReconnectable = ['disconnected', 'error'].includes(status);

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.button
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${bgColor} ${color} border ${borderColor} ${
          isReconnectable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
        whileHover={isReconnectable ? { scale: 1.05 } : {}}
        whileTap={isReconnectable ? { scale: 0.95 } : {}}
        onClick={isReconnectable && onReconnect ? onReconnect : undefined}
        disabled={!isReconnectable || !onReconnect}
      >
        <span className={color}>{icon}</span>
        <span>{text}</span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 px-3 py-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className={color}>{icon}</span>
                <span className="font-medium">{text}</span>
              </div>
              
              {status === 'connected' && lastSynced && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Last synced: {lastSyncedText}
                </div>
              )}
              
              {status === 'error' && (
                <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Click to reconnect
                </div>
              )}
              
              {status === 'disconnected' && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You're currently offline
                </div>
              )}
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(ConnectionStatus);
