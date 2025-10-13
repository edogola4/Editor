export type FeatureFlag = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100 percentage of users who should see this feature
  enableForUsers?: string[]; // Specific user IDs that should have access
  enableForGroups?: string[]; // User groups that should have access
};

export const defaultFeatureFlags: FeatureFlag[] = [
  {
    id: 'codeExecution',
    name: 'Code Execution (Judge0)',
    description: 'Enables code execution using Judge0 API',
    enabled: false,
    rolloutPercentage: 10,
  },
  {
    id: 'voiceChat',
    name: 'Voice Chat',
    description: 'Enables WebRTC based voice chat between collaborators',
    enabled: false,
    rolloutPercentage: 20,
  },
  {
    id: 'screenSharing',
    name: 'Screen Sharing',
    description: 'Allows users to share their screen during pair programming',
    enabled: false,
    rolloutPercentage: 10,
  },
  {
    id: 'pluginSystem',
    name: 'Plugin System',
    description: 'Enables the plugin system for extending editor functionality',
    enabled: false,
    rolloutPercentage: 30,
  },
  {
    id: 'aiCodeCompletion',
    name: 'AI Code Completion',
    description: 'Enables AI-powered code suggestions',
    enabled: false,
    rolloutPercentage: 15,
  },
  {
    id: 'codeReviewWorkflow',
    name: 'Code Review Workflow',
    description: 'Enables collaborative code review features',
    enabled: false,
    rolloutPercentage: 25,
  },
  {
    id: 'workspaceTemplates',
    name: 'Workspace Templates',
    description: 'Allows saving and loading workspace templates',
    enabled: false,
    rolloutPercentage: 20,
  },
  {
    id: 'mobileResponsive',
    name: 'Mobile Responsive',
    description: 'Enhances mobile user experience',
    enabled: true, // Mobile improvements are enabled by default
    rolloutPercentage: 100,
  },
];

export type FeatureFlagKey = typeof defaultFeatureFlags[number]['id'];

// Helper function to check if a feature is enabled for a specific user
export const isFeatureEnabled = (
  featureId: FeatureFlagKey,
  userId?: string,
  userGroups: string[] = []
): boolean => {
  const feature = defaultFeatureFlags.find((f) => f.id === featureId);
  if (!feature) return false;
  
  // If feature is explicitly enabled for this user or their groups
  if (
    (userId && feature.enableForUsers?.includes(userId)) ||
    (userGroups.length > 0 && 
     feature.enableForGroups?.some(group => userGroups.includes(group)))
  ) {
    return true;
  }

  // Check rollout percentage if no specific user/group access
  if (feature.rolloutPercentage !== undefined) {
    // Simple hash function for consistent user assignment
    const hash = userId ? 
      Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100 :
      Math.floor(Math.random() * 100);
    
    return hash < feature.rolloutPercentage;
  }

  return feature.enabled;
};

// React hook for components to use
export const useFeatureFlag = (featureId: FeatureFlagKey): boolean => {
  // In a real app, this would get the current user from context
  const userId = ''; // Get from auth context
  const userGroups: string[] = []; // Get from user profile/context
  
  return isFeatureEnabled(featureId, userId, userGroups);
};
