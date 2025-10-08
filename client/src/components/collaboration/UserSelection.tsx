import React from 'react';

export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface UserSelectionProps {
  range: SelectionRange;
  color: string;
  username: string;
  isActive?: boolean;
}

export const UserSelection: React.FC<UserSelectionProps> = ({
  range,
  color,
  username,
  isActive = false,
}) => {
  const style = {
    position: 'absolute' as const,
    backgroundColor: `${color}30`, // 30% opacity
    borderLeft: `2px solid ${color}`,
    borderRight: `2px solid ${color}`,
    zIndex: 1,
    opacity: isActive ? 1 : 0.7,
    transition: 'opacity 0.2s ease-in-out',
  };

  return (
    <div
      style={{
        ...style,
        top: `${(range.startLineNumber - 1) * 20}px`,
        left: `${(range.startColumn - 1) * 8}px`,
        width: `${(range.endColumn - range.startColumn) * 8}px`,
        height: `${(range.endLineNumber - range.startLineNumber + 1) * 20}px`,
      }}
      className="pointer-events-none"
    >
      {isActive && (
        <div
          className="absolute -top-6 left-0 text-xs px-1 rounded-b whitespace-nowrap"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {username}
        </div>
      )}
    </div>
  );
};
