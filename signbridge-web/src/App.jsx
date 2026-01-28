import React, { useState } from 'react';
import {
  createTheme, ThemeProvider, CssBaseline, Box, Container, Typography,
  Button, Grid, Paper, Stack, Chip, AppBar, Toolbar, Snackbar, Alert,
  LinearProgress
} from '@mui/material';
import { Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DevicesIcon from '@mui/icons-material/Devices';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SignLanguageDetector from './components/SignLanguageDetector';

// Premium Dark Theme with Glassmorphism
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: '#f472b6' },
    background: { default: '#0f0f23', paper: 'rgba(255, 255, 255, 0.03)' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-2px' },
    h2: { fontWeight: 700, letterSpacing: '-1px' },
    h4: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 50, padding: '12px 32px', fontWeight: 600, textTransform: 'none' }
      }
    }
  },
});

const FeatureCard = ({ icon, title, description }) => (
  <Paper elevation={0} sx={{
    p: 4,
    height: '100%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 20px 40px rgba(96, 165, 250, 0.15)'
    }
  }}>
    <Box sx={{ color: 'primary.main', mb: 2, fontSize: 40 }}>{icon}</Box>
    <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>{title}</Typography>
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
      {description}
    </Typography>
  </Paper>
);

const TechBadge = ({ children }) => (
  <Chip
    label={children}
    variant="outlined"
    sx={{
      borderColor: 'rgba(255,255,255,0.2)',
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'monospace',
      fontSize: '0.85rem'
    }}
  />
);

function LandingPage({ startDownload, setMobileGuide }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 18, pb: 12 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 1000, mx: 'auto' }}>
          <Chip
            label="TSA Software Development 2024-2025"
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(167,139,250,0.2) 100%)',
              border: '1px solid rgba(96,165,250,0.3)',
              color: '#60a5fa',
              fontWeight: 600
            }}
          />

          <Typography variant="h1" sx={{
            fontSize: { xs: '2.5rem', md: '4.5rem' },
            background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            lineHeight: 1.1
          }}>
            Breaking Communication Barriers with AI
          </Typography>

          <Typography variant="h5" sx={{
            color: 'rgba(255,255,255,0.6)',
            mb: 5,
            lineHeight: 1.7,
            maxWidth: 700,
            mx: 'auto'
          }}>
            SignBridge is an intelligent desktop application that translates American Sign Language
            in real-time using advanced machine learning and computer vision technology.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              component="a"
              href="/downloads/SignBridge-Installer.dmg"
              download="SignBridge-Installer.dmg"
              onClick={() => startDownload('macOS', true)}
              startIcon={<DownloadIcon />}
              sx={{
                px: 4,
                py: 2,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                boxShadow: '0 8px 30px rgba(96, 165, 250, 0.4)',
                '&:hover': { boxShadow: '0 12px 40px rgba(96, 165, 250, 0.5)' }
              }}
            >
              Download for macOS
            </Button>
            {/* Hidden diagnostic test button */}
            <Button
              component="a"
              href="/downloads/test-small.dmg"
              download="test-small.dmg"
              onClick={() => startDownload('Test', true)}
              sx={{ opacity: 0.1, position: 'absolute', bottom: 0, right: 0 }}
            >
              .
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => startDownload('Windows')}
              startIcon={<DownloadIcon />}
              sx={{
                px: 4,
                py: 2,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
                boxShadow: '0 8px 30px rgba(244, 114, 182, 0.3)',
                '&:hover': { boxShadow: '0 12px 40px rgba(244, 114, 182, 0.4)' }
              }}
            >
              Download for Windows
            </Button>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/app"
              sx={{
                px: 4,
                py: 2,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                boxShadow: '0 8px 30px rgba(52, 211, 153, 0.3)',
                '&:hover': { boxShadow: '0 12px 40px rgba(52, 211, 153, 0.4)' }
              }}
            >
              Launch Online
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Version 1.0.0 • Supports macOS 11+ & Windows 10+
          </Typography>
        </Box>
      </Container>

      {/* About/Features Section */}
      <Container id="about" maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h2" align="center" sx={{ mb: 2, color: 'white' }}>
          How It Works
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 8, color: 'rgba(255,255,255,0.5)', maxWidth: 600, mx: 'auto' }}>
          SignBridge combines cutting-edge AI technologies to provide accurate, real-time sign language translation
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<SpeedIcon fontSize="inherit" />}
              title="Real-Time Detection"
              description="Hand tracking and gesture recognition happens instantly on your device at 30+ FPS, with no cloud processing required."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<PsychologyIcon fontSize="inherit" />}
              title="Teachable AI"
              description="Our KNN-based classifier learns your unique signing style. Train custom gestures in seconds for personalized accuracy."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<SecurityIcon fontSize="inherit" />}
              title="Privacy First"
              description="All processing happens locally on your machine. Your video feed never leaves your device - completely offline capable."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<DevicesIcon fontSize="inherit" />}
              title="Native Desktop App"
              description="Built with Electron for a true native experience. Lightweight overlay mode works seamlessly with video calls."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<SchoolIcon fontSize="inherit" />}
              title="ASL Alphabet Support"
              description="Pre-trained to recognize all 26 ASL alphabet letters out of the box, with the ability to add custom signs."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<CodeIcon fontSize="inherit" />}
              title="Open Architecture"
              description="Built with modern web technologies for easy extensibility. Clean codebase ready for future enhancements."
            />
          </Grid>
        </Grid>
      </Container>

      {/* Tech Stack Section */}
      <Container id="techstack" maxWidth="lg" sx={{ py: 10 }}>
        <Paper elevation={0} sx={{
          p: 6,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(167,139,250,0.05) 100%)',
          border: '1px solid rgba(96,165,250,0.2)'
        }}>
          <Typography variant="h4" align="center" sx={{ mb: 1, color: 'white' }}>
            Built With Modern Technology
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 4, color: 'rgba(255,255,255,0.5)' }}>
            Leveraging industry-standard tools and frameworks
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap sx={{ gap: 2 }}>
            <TechBadge>React 18</TechBadge>
            <TechBadge>Electron</TechBadge>
            <TechBadge>TensorFlow.js</TechBadge>
            <TechBadge>MediaPipe</TechBadge>
            <TechBadge>Material UI</TechBadge>
            <TechBadge>Node.js</TechBadge>
            <TechBadge>WebGL</TechBadge>
            <TechBadge>KNN Classifier</TechBadge>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function App() {
  const [downloadState, setDownloadState] = useState({ open: false, platform: '', progress: 0 });
  const [mobileGuide, setMobileGuide] = useState({ open: false, platform: '' });
  const location = useLocation();

  const startDownload = (platform, isNativeLink = false) => {
    setDownloadState({ open: true, platform, progress: 0 });

    if (platform === 'macOS' && !isNativeLink) {
      // Fallback for cases where it's not a direct link click
      const link = document.createElement('a');
      link.href = '/downloads/SignBridge-Installer.dmg';
      link.download = 'SignBridge-Installer.dmg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const interval = setInterval(() => {
      setDownloadState(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 150);
  };

  const handleClose = () => {
    setDownloadState(prev => ({ ...prev, open: false }));
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isDetectorRoute = location.pathname === '/app';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: isDetectorRoute ? '#050510' : 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f23 50%, #0a0a1a 100%)',
        overflow: isDetectorRoute ? 'hidden' : 'auto'
      }}>

        {/* Navigation - Only show on landing page */}
        {!isDetectorRoute && (
          <AppBar position="fixed" color="transparent" elevation={0} sx={{
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
              <AutoAwesomeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                SignBridge
              </Typography>
              <Button color="inherit" sx={{ mr: 2, opacity: 0.7 }} onClick={() => scrollTo('about')}>About</Button>
              <Button color="inherit" sx={{ mr: 2, opacity: 0.7 }} onClick={() => scrollTo('techstack')}>Tech Stack</Button>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={() => startDownload('Windows')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                  Win
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  component="a"
                  href="/downloads/SignBridge-Installer.dmg"
                  download="SignBridge-Installer.dmg"
                  onClick={() => startDownload('macOS', true)}
                  sx={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    boxShadow: '0 4px 20px rgba(96, 165, 250, 0.4)'
                  }}
                >
                  Mac
                </Button>
              </Stack>
            </Toolbar>
          </AppBar>
        )}

        <Routes>
          <Route path="/" element={<LandingPage startDownload={startDownload} setMobileGuide={setMobileGuide} />} />
          <Route path="/app" element={<SignLanguageDetector />} />
        </Routes>

        {/* Footer - Only show on landing page */}
        {!isDetectorRoute && (
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', py: 4 }}>
            <Container maxWidth="lg">
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    SignBridge © 2025 • TSA Software Development
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mt: { xs: 2, md: 0 } }}>
                  Built with ❤️ for accessibility
                </Typography>
              </Stack>
            </Container>
          </Box>
        )}

        {/* Improved Download Notification */}
        <Snackbar
          open={downloadState.open}
          autoHideDuration={8000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity={downloadState.progress < 100 ? "info" : "success"}
            variant="filled"
            sx={{ width: '100%', minWidth: 320 }}
          >
            <Box sx={{ mb: 1, fontWeight: 600 }}>
              {downloadState.progress < 100
                ? `Preparing ${downloadState.platform} Installer...`
                : `${downloadState.platform} Installer Ready!`}
            </Box>
            {downloadState.progress < 100 && (
              <LinearProgress
                variant="determinate"
                value={downloadState.progress}
                sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: 'rgba(255,255,255,0.1)' }}
              />
            )}
            {downloadState.progress === 100 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {downloadState.platform === 'macOS'
                    ? "Check your Downloads folder for SignBridge-Installer.dmg"
                    : "For the TSA demo, the Windows version is pre-installed on the workstation."}
                </Typography>
                {downloadState.platform === 'macOS' && (
                  <Button
                    size="small"
                    href="/downloads/SignBridge-Installer.dmg"
                    download="SignBridge-Installer.dmg"
                    sx={{ color: 'white', textDecoration: 'underline', mt: 1, p: 0 }}
                  >
                    Didn't start? Click here to retry
                  </Button>
                )}
              </Box>
            )}
          </Alert>
        </Snackbar>

        {/* Mobile Installation Guide */}
        <Snackbar
          open={mobileGuide.open}
          autoHideDuration={10000}
          onClose={() => setMobileGuide({ ...mobileGuide, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setMobileGuide({ ...mobileGuide, open: false })}
            severity="info"
            variant="filled"
            sx={{ width: '100%', minWidth: 320, bgcolor: '#4f46e5' }}
          >
            <Box sx={{ fontWeight: 600, mb: 1 }}>How to Install on {mobileGuide.platform}</Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              1. Open this page in Safari (iOS) or Chrome (Android).<br />
              2. Tap the <strong>Share</strong> (iOS) or <strong>Menu</strong> (Android) icon.<br />
              3. Select <strong>'Add to Home Screen'</strong> to use as a native app!
            </Typography>
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
