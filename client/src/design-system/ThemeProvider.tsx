'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme, darkTheme } from './theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isMounted, setIsMounted] = useState(false);
  const isDark = mode === 'dark' || (mode === 'system' && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Set theme mode in localStorage and apply class to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    
    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', mode);
    setIsMounted(true);
  }, [mode]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme) {
      setMode(savedTheme);
    } else if (typeof window !== 'undefined') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      setMode(systemTheme);
    }
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Don't render until we've determined the theme to avoid flash of unstyled content
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      <MuiThemeProvider theme={isDark ? darkTheme : theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
