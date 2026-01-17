import React from 'react';
import {
  createTheme, ThemeProvider, CssBaseline, Box, Container, Typography,
  Button, Grid, Paper, Stack, Chip, AppBar, Toolbar, Divider
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DevicesIcon from '@mui/icons-material/Devices';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f23 50%, #0a0a1a 100%)'
      }}>

        {/* Navigation */}
        <AppBar position="fixed" color="transparent" elevation={0} sx={{
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
            <AutoAwesomeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              SignBridge
            </Typography>
            <Button color="inherit" sx={{ mr: 2, opacity: 0.7 }} onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}>About</Button>
            <Button color="inherit" sx={{ mr: 2, opacity: 0.7 }} onClick={() => document.getElementById('techstack').scrollIntoView({ behavior: 'smooth' })}>Tech Stack</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} sx={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              boxShadow: '0 4px 20px rgba(96, 165, 250, 0.4)'
            }}>
              Download
            </Button>
          </Toolbar>
        </AppBar>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: 18, pb: 12 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}>
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
                startIcon={<DownloadIcon />}
                sx={{
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  boxShadow: '0 8px 30px rgba(96, 165, 250, 0.4)',
                  '&:hover': { boxShadow: '0 12px 40px rgba(96, 165, 250, 0.5)' }
                }}
              >
                Download for macOS
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white'
                }}
              >
                View Demo
              </Button>
            </Stack>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              Version 1.0.0 • Requires macOS 11+ • Apple Silicon Native
            </Typography>
          </Box>
        </Container>

        {/* Features Section */}
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

        {/* CTA Section */}
        <Container maxWidth="md" sx={{ py: 12 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: 'white', mb: 2 }}>
              Ready to Bridge the Gap?
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 5, maxWidth: 500, mx: 'auto' }}>
              Download SignBridge today and experience seamless sign language translation powered by AI.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #60a5fa 0%, #f472b6 100%)',
                boxShadow: '0 8px 40px rgba(244, 114, 182, 0.4)'
              }}
            >
              Download Now
            </Button>
          </Box>
        </Container>

        {/* Footer */}
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
      </Box>
    </ThemeProvider>
  );
}

export default App;
