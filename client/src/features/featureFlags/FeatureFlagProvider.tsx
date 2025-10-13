import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureFlag, FeatureFlagKey, defaultFeatureFlags } from './featureFlags';

type FeatureFlagContextType = {
  flags: FeatureFlag[];
  isEnabled: (featureId: FeatureFlagKey) => boolean;
  setFlag: (featureId: FeatureFlagKey, enabled: boolean) => void;
  reloadFlags: () => Promise<void>;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(
  undefined
);

type FeatureFlagProviderProps = {
  children: React.ReactNode;
  initialFlags?: FeatureFlag[];
};

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
  initialFlags = defaultFeatureFlags,
}) => {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, you would fetch feature flags from your backend
  const fetchFeatureFlags = async () => {
    try {
      // This would be an API call in a real app
      // const response = await fetch('/api/feature-flags');
      // const data = await response.json();
      // setFlags(data);
      
      // For now, we'll use localStorage to persist flag overrides
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        const parsedFlags = JSON.parse(savedFlags);
        setFlags(parsedFlags);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const isEnabled = (featureId: FeatureFlagKey): boolean => {
    if (isLoading) return false;
    const feature = flags.find((f) => f.id === featureId);
    return feature?.enabled || false;
  };

  const setFlag = (featureId: FeatureFlagKey, enabled: boolean) => {
    setFlags((prevFlags) => {
      const updatedFlags = prevFlags.map((flag) =>
        flag.id === featureId ? { ...flag, enabled } : flag
      );
      
      // In a real app, you would save this to your backend
      localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
      
      return updatedFlags;
    });
  };

  if (isLoading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isEnabled,
        setFlag,
        reloadFlags: fetchFeatureFlags,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

// Hook for individual feature flags
export const useFeatureFlag = (featureId: FeatureFlagKey): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(featureId);
};
