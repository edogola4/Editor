import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../contexts/CollaborationContext';

interface UserCursorProps {
  user: User;
  editor: any; // Monaco editor instance
  showName?: boolean;
  className?: string;
}

const UserCursor: React.FC<UserCursorProps> = ({ 
  user, 
  editor, 
  showName = true,
  className = ''
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef<{lineNumber: number; column: number} | null>(null);
  const [position, setPosition] = React.useState<{top: number; left: number} | null>(null);

  // Update cursor position with smooth animation
  useEffect(() => {
    if (!user.cursorPosition || !editor) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      try {
        const newTop = editor.getTopForPosition(
          user.cursorPosition!.lineNumber,
          user.cursorPosition!.column
        );
        const newLeft = editor.getOffsetForColumn(
          user.cursorPosition!.lineNumber,
          user.cursorPosition!.column
        );

        // Only update if position changed
        if (lastPosition.current?.lineNumber !== user.cursorPosition?.lineNumber || 
            lastPosition.current?.column !== user.cursorPosition?.column) {
          setPosition({ top: newTop, left: newLeft });
          lastPosition.current = { ...user.cursorPosition };
        }
      } catch (e) {
        console.error('Error updating cursor position:', e);
      }
    };

    // Initial position
    updatePosition();

    // Update on editor changes
    const disposable = editor.onDidScrollChange(updatePosition);
    const modelChange = editor.onDidChangeModel(updatePosition);
    const contentChange = editor.onDidChangeModelContent(updatePosition);

    // Cleanup
    return () => {
      disposable.dispose();
      modelChange.dispose();
      contentChange.dispose();
    };
  }, [user.cursorPosition, editor]);

  if (!position || !user.cursorPosition) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={cursorRef}
        className={`absolute z-20 pointer-events-none ${className}`}
        initial={false}
        animate={{
          top: position.top,
          left: position.left,
          opacity: 1,
        }}
        exit={{ opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 700,
          mass: 0.5,
        }}
      >
        {/* Cursor line */}
        <div 
          className="absolute h-6 w-0.5"
          style={{ 
            backgroundColor: user.color,
            boxShadow: `0 0 5px ${user.color}`
          }}
        />
        
        {/* Cursor caret */}
        <motion.div 
          className="absolute w-2 h-3 -ml-0.5 -mt-0.5"
          style={{ 
            backgroundColor: user.color,
            opacity: 0.7,
            borderRadius: '2px 2px 0 0',
          }}
          animate={{
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* User info */}
        {showName && (
          <motion.div 
            className="absolute -top-7 left-1 px-2 py-1 text-xs text-white rounded-full whitespace-nowrap shadow-md"
            style={{ 
              backgroundColor: user.color,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span className="font-medium">{user.name}</span>
            {user.email && (
              <span className="ml-1 opacity-80">({user.email})</span>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(UserCursor);
