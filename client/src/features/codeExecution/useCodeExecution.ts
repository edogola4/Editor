import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ExecutionResult {
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
}

export const useCodeExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(71); // Default to Python

  const executeCode = async (code: string, languageId: number, stdin: string = '') => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCode: code,
          languageId,
          stdin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute code');
      }

      const result = await response.json();
      setExecutionResult(result);
      return result;
    } catch (error) {
      console.error('Execution error:', error);
      toast.error(error.message || 'Failed to execute code');
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isExecuting,
    executionResult,
    executeCode,
    selectedLanguage,
    setSelectedLanguage,
  };
};

// Language options with common languages and their Judge0 IDs
export const languageOptions = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 50, name: 'C (GCC 9.2.0)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
  { id: 60, name: 'Go (1.13.5)' },
  { id: 72, name: 'Rust (1.40.0)' },
  { id: 73, name: 'TypeScript (3.7.4)' },
  { id: 74, name: 'Kotlin (1.3.70)' },
];
