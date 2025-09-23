/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        editor: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          selection: '#264f78',
          lineHighlight: '#2a2d2e',
        },
        // Programming language colors
        syntax: {
          keyword: '#569cd6',
          string: '#ce9178',
          comment: '#6a9955',
          number: '#b5cea8',
          function: '#dcdcaa',
          variable: '#9cdcfe',
          type: '#4ec9b0',
          operator: '#d4d4d4',
        },
        // UI element colors
        sidebar: {
          background: '#252526',
          foreground: '#cccccc',
          border: '#3e3e42',
        },
        statusbar: {
          background: '#007acc',
          foreground: '#ffffff',
          border: '#005f99',
        },
        tab: {
          active: '#1e1e1e',
          inactive: '#2d2d30',
          border: '#3e3e42',
        },
        // User presence colors
        user: {
          cursor: '#00ff00',
          selection: '#264f78',
          avatar: {
            1: '#ff6b6b',
            2: '#4ecdc4',
            3: '#45b7d1',
            4: '#96ceb4',
            5: '#ffeaa7',
            6: '#dda0dd',
            7: '#98d8c8',
            8: '#f7dc6f',
          }
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
