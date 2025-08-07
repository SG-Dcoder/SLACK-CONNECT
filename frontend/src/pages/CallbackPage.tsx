import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Typography, Alert } from '@mui/material';
import api from '../api'; 
import { useAuth } from '../contexts/AuthContext'; 

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [hasExchanged, setHasExchanged] = useState(false); 

  useEffect(() => {
    if (hasExchanged) return; 

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setError('Authorization code is missing from the URL.');
      return;
    }

    async function exchangeToken() {
      try {
        
        const response = await api.get(`/auth/token?code=${code}&state=${state ?? ''}`);
        const data = response.data;

        if (data.accessToken && data.user) {
          login(data.user, data.accessToken);
          setHasExchanged(true);

          navigate('/', { replace: true });
        } else {
          setError('Failed to get access token from backend.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentication failed. Please try again.');
      }
    }

    exchangeToken();
  }, [location.search, hasExchanged, login, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Completing Authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your credentials.
          </Typography>
        </>
      )}
    </Container>
  );
};

export default CallbackPage;
