import React, { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';

interface CursorIndicatorProps {
  editor: monaco.editor.ICodeEditor | null;
  userId: string;
  user: {
    id: string;
    name: string;
    color: string;
    position: { lineNumber: number; column: number };
    selection?: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
  };
}

export const CursorIndicator: React.FC<CursorIndicatorProps> = ({ editor, userId, user }) => {
  const decorationRef = useRef<string[]>([]);
  const selectionDecorationRef = useRef<string[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Update cursor position and selection
  const updateDecorations = useCallback(() => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Update cursor position
    const position = user.position;
    const cursorDecoration: monaco.editor.IModelDeltaDecoration = {
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column + 1
      ),
      options: {
        className: 'remote-cursor',
        glyphMarginClassName: 'remote-cursor-glyph',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    };

    // Update cursor decorations
    decorationRef.current = editor.deltaDecorations(
      decorationRef.current,
      [cursorDecoration]
    );

    // Update selection if it exists
    if (user.selection) {
      const selectionDecoration: monaco.editor.IModelDeltaDecoration = {
        range: new monaco.Range(
          user.selection.startLineNumber,
          user.selection.startColumn,
          user.selection.endLineNumber,
          user.selection.endColumn
        ),
        options: {
          className: 'remote-selection',
          isWholeLine: false,
          className: `remote-selection-${userId}`,
          hoverMessage: {
            value: `${user.name || 'Anonymous'}'s selection`,
          },
        },
      };

      selectionDecorationRef.current = editor.deltaDecorations(
        selectionDecorationRef.current,
        [selectionDecoration]
      );
    } else {
      // Clear selection if it doesn't exist
      selectionDecorationRef.current = editor.deltaDecorations(
        selectionDecorationRef.current,
        []
      );
    }
  }, [editor, user, userId]);

  // Update tooltip position
  const updateTooltip = useCallback(() => {
    if (!editor || !tooltipRef.current || !user.position) return;

    const position = editor.getPosition();
    if (!position) return;

    // Only show tooltip if cursor is on the same line
    if (position.lineNumber === user.position.lineNumber) {
      const domNode = editor.getDomNode();
      if (!domNode) return;

      const viewZone = document.createElement('div');
      viewZone.className = 'cursor-tooltip';
      viewZone.style.position = 'absolute';
      viewZone.style.pointerEvents = 'none';
      viewZone.style.whiteSpace = 'nowrap';
      viewZone.style.backgroundColor = user.color;
      viewZone.style.color = 'white';
      viewZone.style.padding = '2px 6px';
      viewZone.style.borderRadius = '4px';
      viewZone.style.fontSize = '12px';
      viewZone.style.zIndex = '100';
      viewZone.textContent = user.name || 'Anonymous';

      const editorRect = domNode.getBoundingClientRect();
      const cursorCoords = editor.getScrolledVisiblePosition({
        lineNumber: user.position.lineNumber,
        column: user.position.column,
      });

      if (cursorCoords) {
        const top = cursorCoords.top - editor.getScrollTop() + editorRect.top;
        const left = cursorCoords.left - editor.getScrollLeft() + editorRect.left;

        // Position the tooltip above the cursor
        tooltipRef.current.style.top = `${top - 30}px`;
        tooltipRef.current.style.left = `${left}px`;
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.textContent = user.name || 'Anonymous';
        tooltipRef.current.style.backgroundColor = user.color;
      }
    } else {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    }
  }, [editor, user]);

  // Set up listeners
  useEffect(() => {
    if (!editor) return;

    updateDecorations();
    updateTooltip();

    const disposable = editor.onDidScrollChange(() => {
      updateTooltip();
    });

    return () => {
      disposable.dispose();
      // Clean up decorations
      if (decorationRef.current.length > 0) {
        editor.deltaDecorations(decorationRef.current, []);
      }
      if (selectionDecorationRef.current.length > 0) {
        editor.deltaDecorations(selectionDecorationRef.current, []);
      }
    };
  }, [editor, updateDecorations, updateTooltip]);

  // Add CSS for cursor and selection
  useEffect(() => {
    if (!document.getElementById('cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'cursor-styles';
      style.textContent = `
        .remote-cursor {
          position: relative;
          border-left: 2px solid;
          margin-left: -1px;
          box-sizing: border-box;
          pointer-events: none;
          z-index: 5;
        }
        
        .remote-cursor:after {
          content: '';
          position: absolute;
          top: -1px;
          left: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transform: translateY(-50%);
        }
        
        .remote-cursor-glyph {
          width: 2px !important;
          margin-left: -1px;
        }
        
        .cursor-tooltip {
          position: fixed;
          pointer-events: none;
          white-space: nowrap;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 100;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `;
      document.head.appendChild(style);
    }

    // Add dynamic style for selection
    const selectionStyle = document.createElement('style');
    selectionStyle.textContent = `
      .remote-selection-${userId} {
        background-color: ${user.color}33; /* 20% opacity */
      }
      
      .monaco-editor .view-overlays .remote-selection-${userId} {
        background-color: ${user.color}33;
      }
    `;
    document.head.appendChild(selectionStyle);

    return () => {
      document.head.removeChild(selectionStyle);
    };
  }, [userId, user.color]);

  return (
    <div
      ref={tooltipRef}
      className="cursor-tooltip"
      style={{
        display: 'none',
        position: 'fixed',
        pointerEvents: 'none',
        backgroundColor: user.color,
        color: 'white',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 100,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    />
  );
};

export default CursorIndicator;
