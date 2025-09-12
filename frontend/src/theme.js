import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0999afff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      contrastText: '#ffffff',
    },
    background: {
      // new soft-tinted background across the app
      default: '#f2f6ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
    },
    divider: 'rgba(17,24,39,0.14)',
    action: {
      active: 'rgba(17,24,39,0.72)', // default icon color (more visible)
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          '@media (min-width:600px)': { minHeight: 68 },
          paddingLeft: 12,
          paddingRight: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.015))',
          border: '1px solid rgba(17,24,39,0.14)', // clearer border
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          border: '1px solid rgba(17,24,39,0.14)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // refreshed navbar gradient
          background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)',
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // refreshed sidebar background and readable text/icons
          background: 'linear-gradient(180deg, #f9fbff 0%, #eaf1ff 100%)',
          color: '#0f172a',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(17,24,39,0.14)',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(17,24,39,0.8)', // more visible sidebar icons
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.98rem',
          fontWeight: 600,
          letterSpacing: '0.2px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
          color: '#ffffff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-outlined': {
            borderColor: 'rgba(17,24,39,0.2)',
            color: '#111827',
          },
        },
      },
    },
  },
})

export default theme
