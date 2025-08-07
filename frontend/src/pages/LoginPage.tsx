// src/pages/LoginPage.tsx

import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';

const LoginPage: React.FC = () => {
  const handleSlackLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/slack`;
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Slack Connect
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Connect your Slack workspace to send and schedule messages
        </Typography>
        <Box>
          <Button
            variant="contained"
            size="large"
            onClick={handleSlackLogin}
            sx={{
              backgroundColor: '#4A154B',
              '&:hover': {
                backgroundColor: '#3e1347',
              },
            }}
          >
            Connect with Slack
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
