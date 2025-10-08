import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../contexts/CollaborationContext';

interface UserSelectionProps {
  user: User;
  editor: any; // Monaco editor instance
  className?: string;
}

const UserSelection: React.FC<UserSelectionProps> = ({ 
  user, 
  editor, 
  className = '' 
}) => {
  const [selection, setSelection] = useState<{
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const lastSelection = useRef<typeof selection>(null);

  useEffect(() => {
    if (!user.selection || !editor) {
      setSelection(null);
      return;
    }

    const updateSelection = () => {
      try {
        const { startLineNumber, startColumn, endLineNumber, endColumn } = user.selection!;
        
        // Skip if selection is empty
        if (startLineNumber === endLineNumber && startColumn === endColumn) {
          setSelection(null);
          return;
        }

        // Get positions from Monaco
        const startTop = editor.getTopForPosition(startLineNumber, startColumn);
        const endTop = editor.getTopForPosition(endLineNumber, endColumn);
        const startLeft = editor.getOffsetForColumn(startLineNumber, startColumn);
        const endLeft = editor.getOffsetForColumn(endLineNumber, endColumn);

        // Calculate dimensions
        const width = Math.abs(endLeft - startLeft) + 2; // Add padding
        const height = Math.abs(endTop - startTop) + 16; // Add line height

        const newSelection = {
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
          top: Math.min(startTop, endTop),
          left: Math.min(startLeft, endLeft),
          width,
          height
        };

        // Only update if selection actually changed
        if (JSON.stringify(newSelection) !== JSON.stringify(lastSelection.current)) {
          setSelection(newSelection);
          lastSelection.current = newSelection;
        }
      } catch (e) {
        console.error('Error updating selection:', e);
      }
    };

    // Initial update
    updateSelection();

    // Update on editor changes
    const disposable = editor.onDidScrollChange(updateSelection);
    const modelChange = editor.onDidChangeModel(updateSelection);
    const contentChange = editor.onDidChangeModelContent(updateSelection);

    // Cleanup
    return () => {
      disposable.dispose();
      modelChange.dispose();
      contentChange.dispose();
    };
  }, [user.selection, editor]);

  if (!selection) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`absolute z-10 pointer-events-none ${className}`}
        initial={{
          opacity: 0,
          scaleX: 0.95,
          transformOrigin: 'left center',
        }}
        animate={{
          x: selection.left,
          y: selection.top,
          width: selection.width,
          height: selection.height,
          opacity: 0.2,
          scaleX: 1,
        }}
        exit={{
          opacity: 0,
          scaleX: 0.95,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 500,
          mass: 0.5,
        }}
        style={{
          backgroundColor: user.color,
          borderRadius: '2px',
          boxShadow: `0 0 0 1px ${user.color}40`,
          willChange: 'transform, opacity',
        }}
      >
        {/* Selection border highlight */}
        <motion.div 
          className="absolute inset-0 border-2"
          style={{
            borderColor: user.color,
            opacity: 0.6,
            borderRadius: '2px',
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* User label at the start of selection */}
        <motion.div 
          className="absolute -top-6 left-0 px-2 py-0.5 text-xs text-white rounded-t whitespace-nowrap"
          style={{
            backgroundColor: user.color,
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          <span className="font-medium">{user.name}</span>
          {user.email && (
            <span className="ml-1 opacity-80 text-xxs">({user.email})</span>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(UserSelection);
