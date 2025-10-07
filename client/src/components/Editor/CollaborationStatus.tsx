import React, { useEffect, useState, useMemo } from 'react';
import { Box, Avatar, AvatarGroup, Tooltip, Typography, Chip, Fade } from '@mui/material';
import { webSocketService } from '../../services/websocket.service';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

interface UserPresence extends User {
  color: string;
  lastSeen?: Date;
  isActive: boolean;
}

const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Light Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B59B6', // Purple
  '#E67E22', // Orange
];

export const CollaborationStatus: React.FC<{ documentId: string }> = ({ documentId }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Record<string, UserPresence>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Generate a consistent color for each user
  const getUserColor = (userId: string) => {
    const index = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (!documentId) return;

    const handleUserJoined = (user: User) => {
      setUsers(prev => ({
        ...prev,
        [user.id]: {
          ...user,
          color: getUserColor(user.id),
          lastSeen: new Date(),
          isActive: true,
        },
      }));
    };

    const handleUserLeft = (userId: string) => {
      setUsers(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          isActive: false,
          lastSeen: new Date(),
        },
      }));
    };

    const handleConnected = () => setConnectionStatus('connected');
    const handleDisconnected = () => setConnectionStatus('disconnected');

    // Set up WebSocket event listeners
    const unsubJoin = webSocketService.onUserJoined(handleUserJoined);
    const unsubLeave = webSocketService.onUserLeft(handleUserLeft);
    const unsubConnect = webSocketService.onConnected(handleConnected);
    const unsubDisconnect = webSocketService.onDisconnected(handleDisconnected);

    // Connect to WebSocket
    webSocketService.connect(documentId).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('disconnected');
    });

    // Clean up
    return () => {
      unsubJoin();
      unsubLeave();
      unsubConnect();
      unsubDisconnect();
      webSocketService.disconnect();
    };
  }, [documentId]);

  // Filter out inactive users after 30 seconds
  const activeUsers = useMemo(() => {
    const now = new Date();
    return Object.values(users).filter(
      user => user.isActive || (user.lastSeen && (now.getTime() - new Date(user.lastSeen).getTime() < 30000))
    );
  }, [users]);

  // Connection status indicator
  const connectionStatusIndicator = (
    <Box display="flex" alignItems="center" ml={1}>
      <Box
        width={8}
        height={8}
        borderRadius="50%"
        bgcolor={
          connectionStatus === 'connected' 
            ? '#4CAF50' 
            : connectionStatus === 'connecting' 
            ? '#FFC107' 
            : '#F44336'
        }
        mr={1}
      />
      <Typography variant="caption" color="textSecondary">
        {connectionStatus === 'connected' 
          ? 'Connected' 
          : connectionStatus === 'connecting' 
          ? 'Connecting...' 
          : 'Disconnected'}
      </Typography>
    </Box>
  );

  if (activeUsers.length === 0) {
    return (
      <Box display="flex" alignItems="center">
        <Typography variant="caption" color="textSecondary">
          {connectionStatus === 'connected' ? 'No other users online' : 'Connecting...'}
        </Typography>
        {connectionStatusIndicator}
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center">
      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
        {activeUsers.map(user => (
          <Tooltip 
            key={user.id} 
            title={
              <>
                <div>{user.name || 'Anonymous'}</div>
                {user.id === currentUser?.id && <div>(You)</div>}
              </>
            }
            arrow
          >
            <Fade in={true} timeout={500}>
              <Avatar 
                sx={{ 
                  bgcolor: user.color,
                  width: 24, 
                  height: 24,
                  fontSize: '0.75rem',
                  border: user.id === currentUser?.id ? '2px solid #1976d2' : 'none',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Avatar>
            </Fade>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Typography variant="caption" color="textSecondary" ml={1}>
        {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} editing
      </Typography>
      {connectionStatusIndicator}
    </Box>
  );
};

export default CollaborationStatus;
