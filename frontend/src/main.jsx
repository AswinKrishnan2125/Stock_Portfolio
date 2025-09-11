import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1e88e5' },
    secondary: { main: '#8e24aa' },
    success: { main: '#2e7d32' },
    error: { main: '#d32f2f' },
    warning: { main: '#f9a825' },
    info: { main: '#0288d1' },
    background: { default: '#f6f8fb' }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 }
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 10, textTransform: 'none' } }
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16 } }
    },
    MuiPaper: {
      defaultProps: { elevation: 1 }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
