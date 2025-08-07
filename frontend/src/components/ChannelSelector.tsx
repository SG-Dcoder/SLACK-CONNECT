import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface Channel {
  id: string;
  name: string;
}

interface ChannelSelectorProps {
  channels: Channel[];
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({ channels, selectedChannel, onChannelSelect }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="channel-select-label">Select Channel</InputLabel>
      <Select
        labelId="channel-select-label"
        value={selectedChannel}
        label="Select Channel"
        onChange={(e) => onChannelSelect(e.target.value as string)}
      >
        {channels.map((channel) => (
          <MenuItem key={channel.id} value={channel.id}>
            #{channel.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ChannelSelector;
