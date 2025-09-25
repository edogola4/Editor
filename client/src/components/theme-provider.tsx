import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  enableSystem = true 
}: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    setMounted(true);
    
    // Apply theme class to document element
    const root = window.document.documentElement;
    
    // Clear existing classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      root.classList.add(systemTheme);
    } else if (theme && theme !== 'system') {
      root.classList.add(theme);
    }
    
    // Cleanup
    return () => {
      root.classList.remove('light', 'dark');
    };
  }, [theme, enableSystem]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Create a context for theme
const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => {},
});

// Custom hook to use theme
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
