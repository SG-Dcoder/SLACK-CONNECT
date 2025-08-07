import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';

interface ScheduledMessage {
  id: string;
  channel: string;
  message: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
}

interface ScheduledMessagesListProps {
  messages: ScheduledMessage[];
  onMessageCancelled: (id: string) => void;
}

const ScheduledMessagesList: React.FC<ScheduledMessagesListProps> = ({ messages, onMessageCancelled }) => {
  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled message?')) {
      return;
    }

    try {
      await api.delete(`/messages/scheduled/${id}`);
      onMessageCancelled(id);
      alert('Scheduled message cancelled.');
    } catch (error) {
      console.error('Failed to cancel scheduled message:', error);
      alert('Failed to cancel message. Please try again.');
    }
  };


  const now = new Date();
  const upcomingMessages = messages.filter(message => {
    const scheduledTime = new Date(message.scheduledAt);
    return scheduledTime > now;
  });

  
  const getTimeUntilSend = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Sending now...';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `In ${diffHours}h ${diffMinutes}m`;
    } else {
      return `In ${diffMinutes}m`;
    }
  };

  if (upcomingMessages.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No upcoming scheduled messages
      </Typography>
    );
  }

  return (
    <List>
      {upcomingMessages.map((msg) => (
        <ListItem
          key={msg.id}
          secondaryAction={
            <IconButton 
              edge="end" 
              aria-label="cancel" 
              onClick={() => handleCancel(msg.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          }
          sx={{ 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1, 
            mb: 1,
            backgroundColor: 'background.paper'
          }}
        >
          <Stack width="100%" spacing={1}>
            <ListItemText
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {msg.message}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Channel: {msg.channel} | Scheduled: {new Date(msg.scheduledAt).toLocaleString()}
                </Typography>
              }
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={getTimeUntilSend(msg.scheduledAt)}
                color="primary"
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" color="success.main">
                ● Scheduled
              </Typography>
            </Stack>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
};

export default ScheduledMessagesList;
