import React from 'react';
import SignLanguageDetector from './components/SignLanguageDetector';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SignLanguageDetector />
    </ThemeProvider>
  );
}

export default App;
