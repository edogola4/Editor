import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store';

type UpdateFunction<T> = (current: T) => T;

interface OptimisticUpdateOptions<T> {
  // The store setter function (e.g., setEditorState, setRoomState)
  setter: (updater: T | ((current: T) => T)) => void;
  
  // Function to perform the actual API call
  apiCall: (data: T) => Promise<any>;
  
  // Success callback (optional)
  onSuccess?: (result: any) => void;
  
  // Error callback (optional)
  onError?: (error: Error) => void;
  
  // Whether to rollback on error (default: true)
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<T>({
  setter,
  apiCall,
  onSuccess,
  onError,
  rollbackOnError = true,
}: OptimisticUpdateOptions<T>) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousStateRef = useRef<T | null>(null);

  const execute = useCallback(async (update: T | UpdateFunction<T>) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Store the current state for potential rollback
      previousStateRef.current = getCurrentState(setter);
      
      // Apply the optimistic update
      setter(prev => (typeof update === 'function' 
        ? (update as UpdateFunction<T>)(prev) 
        : update));
      
      // Execute the API call
      const result = await apiCall(
        typeof update === 'function' 
          ? (update as UpdateFunction<T>)(previousStateRef.current) 
          : update
      );
      
      // Call success handler if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      
      // Rollback to previous state on error if enabled
      if (rollbackOnError && previousStateRef.current !== null) {
        setter(previousStateRef.current);
      }
      
      // Call error handler if provided
      if (onError) {
        onError(error);
      } else {
        // Default error handling
        console.error('Optimistic update failed:', error);
      }
      
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [apiCall, onError, onSuccess, rollbackOnError, setter]);

  return {
    execute,
    isUpdating,
    error,
  };
}

// Helper function to get the current state from a setter function
function getCurrentState<T>(setter: (updater: T | ((current: T) => T)) => void): T {
  let currentState: T | null = null;
  
  // Create a mock updater that captures the current state
  const captureState = (state: T) => {
    currentState = state;
    return state;
  };
  
  // Call the setter with our mock updater
  setter(captureState as any);
  
  if (currentState === null) {
    throw new Error('Failed to capture current state');
  }
  
  return currentState;
}

// Example usage:
/*
const { execute: updateContent, isUpdating, error } = useOptimisticUpdate({
  setter: useStore(state => state.setEditorState),
  apiCall: async (content) => {
    const response = await api.updateDocumentContent(documentId, content);
    return response.data;
  },
  onSuccess: () => {
    // Show success notification
  },
  onError: (error) => {
    // Show error notification
  },
});

// Later in your component:
<button onClick={() => updateContent('New content')} disabled={isUpdating}>
  {isUpdating ? 'Saving...' : 'Save'}
</button>
*/
