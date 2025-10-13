import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ExecutionResultProps {
  result: {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    status: {
      id: number;
      description: string;
    };
    time: string;
    memory: number | null;
  } | null;
  isExecuting: boolean;
  className?: string;
}

export const ExecutionResult: React.FC<ExecutionResultProps> = ({
  result,
  isExecuting,
  className = '',
}) => {
  if (isExecuting) {
    return (
      <div className={cn('p-4 bg-gray-50 dark:bg-gray-800 rounded-md', className)}>
        <div className="flex items-center space-x-2 text-blue-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { stdout, stderr, compile_output, status, time, memory } = result;
  const isError = status.id > 3; // Status IDs > 3 indicate errors
  const hasOutput = stdout || stderr || compile_output;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isError ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <span className="font-medium">
            {isError ? 'Execution Failed' : 'Execution Succeeded'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {status.description}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {time && `Time: ${time}s`}
          {memory !== null && ` • Memory: ${(memory / 1024).toFixed(2)} MB`}
        </div>
      </div>

      {hasOutput && (
        <div className="space-y-2">
          {stderr && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm font-mono whitespace-pre-wrap">
              {stderr}
            </div>
          )}
          
          {compile_output && !stderr && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md text-sm font-mono whitespace-pre-wrap">
              {compile_output}
            </div>
          )}
          
          {stdout && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm font-mono whitespace-pre-wrap">
              {stdout}
            </div>
          )}
        </div>
      )}

      {!hasOutput && !isError && (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          No output to display. The code executed successfully but didn't produce any output.
        </div>
      )}
    </div>
  );
};
