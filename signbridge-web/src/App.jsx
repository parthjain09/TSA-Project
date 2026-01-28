import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import SignLanguageDetector from './components/SignLanguageDetector';

// Premium Dark Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: '#a78bfa' },
    background: {
      default: '#0f0f23',
      paper: 'rgba(255, 255, 255, 0.05)'
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<SignLanguageDetector />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
