import React, { useState } from 'react';
import { Play, ChevronDown } from 'lucide-react';
import { useCodeExecution, languageOptions } from './useCodeExecution';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface ExecutionControlsProps {
  code: string;
  onExecute?: (result: any) => void;
  className?: string;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  code,
  onExecute,
  className = '',
}) => {
  const { executeCode, isExecuting, selectedLanguage, setSelectedLanguage } = useCodeExecution();
  const [isOpen, setIsOpen] = useState(false);

  const handleExecute = async () => {
    try {
      const result = await executeCode(code, selectedLanguage);
      if (onExecute) {
        onExecute(result);
      }
    } catch (error) {
      console.error('Execution error:', error);
    }
  };

  const selectedLanguageName =
    languageOptions.find((lang) => lang.id === selectedLanguage)?.name || 'Select Language';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-sm font-medium"
          >
            {selectedLanguageName}
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
          {languageOptions.map((lang) => (
            <DropdownMenuItem
              key={lang.id}
              onSelect={() => setSelectedLanguage(lang.id)}
              className={`cursor-pointer ${selectedLanguage === lang.id ? 'bg-accent' : ''}`}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        size="sm"
        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        {isExecuting ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Run Code
          </>
        )}
      </Button>
    </div>
  );
};
