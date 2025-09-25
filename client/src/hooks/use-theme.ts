import * as React from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>('dark');
  const [mounted, setMounted] = React.useState(false);

  // Set the theme class on the document element and save to localStorage
  const setTheme = React.useCallback((theme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove both theme classes to prevent conflicts
    root.classList.remove('light', 'dark');
    
    // Add the new theme class
    root.classList.add(theme);
    
    // Update state
    setThemeState(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // LocalStorage may be disabled or full
      console.error('Failed to save theme preference', e);
    }
  }, []);

  // Initialize theme on mount
  React.useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
    
    // Mark as mounted to avoid hydration mismatch
    setMounted(true);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  // Toggle between light and dark theme
  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    mounted,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
}
