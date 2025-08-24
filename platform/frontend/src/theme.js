import { createTheme } from '@mui/material/styles';

// Color palette
const colors = {
  primary: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7c3aed',
    light: '#8b5cf6',
    dark: '#6d28d9',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
  },
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
  },
};

// Typography
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.025em',
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.025em',
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.025em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.025em',
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    letterSpacing: '0.025em',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    letterSpacing: '0.025em',
  },
  button: {
    textTransform: 'none',
    fontWeight: 500,
    letterSpacing: '0.025em',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.025em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};

// Component overrides
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        scrollBehavior: 'smooth',
      },
      body: {
        backgroundColor: colors.background.default,
        color: colors.text.primary,
        fontFamily: typography.fontFamily,
        lineHeight: 1.6,
      },
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: colors.grey[100],
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb': {
        background: colors.grey[300],
        borderRadius: '4px',
        '&:hover': {
          background: colors.grey[400],
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
        },
      },
      outlined: {
        borderWidth: '1.5px',
        '&:hover': {
          borderWidth: '1.5px',
        },
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1rem',
      },
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.75rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease-in-out',
        border: `1px solid ${colors.grey[200]}`,
        '&:hover': {
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)',
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
      elevation2: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      elevation3: {
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.main,
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.main,
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '0.75rem',
        height: '24px',
      },
      outlined: {
        borderWidth: '1.5px',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: `1px solid ${colors.grey[200]}`,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${colors.grey[200]}`,
        backgroundColor: colors.background.paper,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          backgroundColor: colors.grey[50],
          fontWeight: 600,
          fontSize: '0.875rem',
          color: colors.text.primary,
          borderBottom: `2px solid ${colors.grey[200]}`,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${colors.grey[200]}`,
        padding: '16px',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        fontSize: '0.875rem',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: '4px',
        backgroundColor: colors.grey[200],
      },
      bar: {
        borderRadius: '4px',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: colors.grey[100],
          transform: 'scale(1.05)',
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: colors.grey[800],
        color: colors.background.paper,
        fontSize: '0.75rem',
        borderRadius: '6px',
        padding: '8px 12px',
      },
    },
  },
};

// Create theme
const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    grey: colors.grey,
    background: colors.background,
    text: colors.text,
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.06)',
    '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '0 25px 50px rgba(0, 0, 0, 0.25)',
    ...Array(19).fill('none'),
  ],
});

export default theme; 