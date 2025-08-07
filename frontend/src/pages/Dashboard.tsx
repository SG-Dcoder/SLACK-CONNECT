import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import api from '../api';

import ChannelSelector from '../components/ChannelSelector';
import MessageForm from '../components/MessageForm';
import ScheduledMessagesList from '../components/ScheduledMessagesList';

import type { Channel, ScheduledMessage } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [channelsResponse, scheduledResponse] = await Promise.all([
          api.get('/messages/channels'),
          api.get('/messages/scheduled'),
        ]);
        setChannels(channelsResponse.data.channels ?? []);
        setSelectedChannel(channelsResponse.data.channels?.[0]?.id ?? '');
        
        
        const allMessages = scheduledResponse.data.scheduledMessages ?? [];
        const upcomingMessages = filterUpcomingMessages(allMessages);
        setScheduledMessages(upcomingMessages);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  useEffect(() => {
    const filterInterval = setInterval(() => {
      const now = new Date();
      setScheduledMessages(prev => prev.filter(message => {
        const scheduledTime = new Date(message.scheduledAt);
        return scheduledTime > now;
      }));
    }, 5000); 

    return () => clearInterval(filterInterval);
  }, []);

  
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshScheduledMessages();
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

 
  const filterUpcomingMessages = (messages: ScheduledMessage[]) => {
    const now = new Date();
    return messages.filter(message => {
      const scheduledTime = new Date(message.scheduledAt);
      return scheduledTime > now;
    });
  };

  
  const refreshScheduledMessages = async () => {
    try {
      const response = await api.get('/messages/scheduled');
      const allMessages = response.data.scheduledMessages ?? [];
      
     
      const upcomingMessages = filterUpcomingMessages(allMessages);
      setScheduledMessages(upcomingMessages);
    } catch (error) {
      console.error('Failed to refresh scheduled messages', error);
    }
  };

  const handleMessageSentOrScheduled = () => {
    refreshScheduledMessages();
  };

  const handleScheduledMessageCancelled = (id: string) => {
    setScheduledMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  if (loading) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Slack Connect
          </Typography>
          <Typography sx={{ mr: 2 }}>
            {user?.slackUserId}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack spacing={4}>
          {/* Channel Selector */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Slack Channel
            </Typography>
            <ChannelSelector
              channels={channels}
              selectedChannel={selectedChannel}
              onChannelSelect={setSelectedChannel}
            />
          </Paper>

          {/* Two column layout: MessageForm | ScheduledMessagesList */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            useFlexGap
          >
            <Paper sx={{ p: 3, flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Send a Message
              </Typography>
              <MessageForm
                selectedChannel={selectedChannel}
                onMessageSent={handleMessageSentOrScheduled}
              />
            </Paper>
            <Paper sx={{ p: 3, flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Scheduled Messages
              </Typography>
              <ScheduledMessagesList
                messages={scheduledMessages}
                onMessageCancelled={handleScheduledMessageCancelled}
              />
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard;
