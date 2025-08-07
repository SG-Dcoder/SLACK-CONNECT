// src/components/MessageForm.tsx

import React, { useState } from 'react';
import {
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import api from '../api';

interface MessageFormProps {
  selectedChannel: string;
  onMessageSent: () => void;
}

const MessageForm: React.FC<MessageFormProps> = ({ selectedChannel, onMessageSent }) => {
  const [text, setText] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = async () => {
    if (!selectedChannel) {
      alert('Please select a channel first.');
      return;
    }
    if (!text.trim()) {
      alert('Message text cannot be empty.');
      return;
    }
    if (isScheduled && !scheduledAt) {
      alert('Please select a scheduled time.');
      return;
    }

    try {
      if (isScheduled) {
        await api.post('/messages/schedule', {
          channel: selectedChannel,
          text: text.trim(),
          scheduledAt,
        });
      } else {
        await api.post('/messages/send', {
          channel: selectedChannel,
          text: text.trim(),
        });
      }
      setText('');
      setScheduledAt('');
      onMessageSent();
      alert(isScheduled ? 'Message scheduled!' : 'Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Message Text"
        multiline
        minRows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
      />

      <FormControlLabel
        control={
          <Switch
            checked={isScheduled}
            onChange={(e) => setIsScheduled(e.target.checked)}
            color="primary"
          />
        }
        label="Schedule for later"
      />

      {isScheduled && (
        <TextField
          label="Scheduled Time"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      )}

      <Button variant="contained" onClick={handleSubmit} disabled={!text.trim()}>
        {isScheduled ? 'Schedule Message' : 'Send Now'}
      </Button>
    </Stack>
  );
};

export default MessageForm;
