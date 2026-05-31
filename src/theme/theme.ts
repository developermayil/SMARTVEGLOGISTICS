import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32',      // Deep forest green
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF6F00',      // Harvest amber
      light: '#FFA000',
      dark: '#E65100',
      contrastText: '#fff',
    },
    background: {
      default: '#F5F7F5',
      paper: '#FFFFFF',
    },
    success: { main: '#43A047' },
    warning: { main: '#FB8C00' },
    error: { main: '#E53935' },
    info: { main: '#039BE5' },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;
