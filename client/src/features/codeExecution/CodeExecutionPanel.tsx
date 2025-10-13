import React, { useState } from 'react';
import { ExecutionControls } from './ExecutionControls';
import { ExecutionResult } from './ExecutionResult';
import { Panel, PanelContent, PanelHeader, PanelTitle } from '../../components/ui/panel';
import { useCodeExecution } from './useCodeExecution';

interface CodeExecutionPanelProps {
  code: string;
  className?: string;
  defaultOpen?: boolean;
}

export const CodeExecutionPanel: React.FC<CodeExecutionPanelProps> = ({
  code,
  className = '',
  defaultOpen = false,
}) => {
  const { executionResult, isExecuting } = useCodeExecution();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Panel className={className}>
      <PanelHeader 
        className="border-b px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <PanelTitle className="text-sm font-medium">Code Execution</PanelTitle>
        <div className="flex items-center space-x-2">
          <ExecutionControls code={code} />
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </PanelHeader>
      {isOpen && (
        <PanelContent className="p-4">
          <ExecutionResult result={executionResult} isExecuting={isExecuting} />
        </PanelContent>
      )}
    </Panel>
  );
};
