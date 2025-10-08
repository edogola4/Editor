import React from 'react';
import { motion } from 'framer-motion';

export interface UserCursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
  isTyping?: boolean;
}

export const UserCursor: React.FC<UserCursorProps> = ({ x, y, color, name, isTyping = false }) => {
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ type: 'spring', damping: 30, stiffness: 700 }}
    >
      <div className="flex items-center">
        <div 
          className="w-2 h-4 relative"
          style={{ backgroundColor: color }}
        >
          <div className="absolute -top-5 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {name}
            {isTyping && (
              <span className="ml-1 inline-flex space-x-0.5">
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse"></span>
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
