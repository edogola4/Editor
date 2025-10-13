import { createTheme, Theme } from '@mui/material/styles';
import './theme.types';

// Extend the Theme type to include our custom palette
declare module '@mui/material/styles' {
  interface Theme {
    palette: {
      accent: {
        blue: string;
        green: string;
        yellow: string;
        red: string;
        purple: string;
      };
    };
  }
  // Allow configuration using `createTheme`
  interface ThemeOptions {
    palette?: {
      accent?: {
        blue?: string;
        green?: string;
        yellow?: string;
        red?: string;
        purple?: string;
      };
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      900: '#0A0E27',
      800: '#0D1B3E',
      700: '#1E293B',
      600: '#334155',
      500: '#475569',
      400: '#94A3B8',
      300: '#CBD5E1',
      200: '#E2E8F0',
      100: '#F1F5F9',
      50: '#F8FAFC',
    },
    accent: {
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#F59E0B',
      red: '#EF4444',
      purple: '#8B5CF6',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      disabled: '#94A3B8',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    text: {
      primary: '#F8FAFC',
      secondary: '#E2E8F0',
      disabled: '#94A3B8',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
  },
});

export type Theme = typeof theme;
