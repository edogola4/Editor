import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // Add other user properties as needed
}

export const useUser = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useUser must be used within an AuthProvider');
  }

  return {
    user: context.user,
    isLoading: context.isLoading,
    isAuthenticated: !!context.user,
    login: context.login,
    logout: context.logout,
    register: context.register,
  };
};
