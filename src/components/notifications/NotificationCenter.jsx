import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Chip,
  Alert,
  Paper
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as ActiveIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import notificationService from '../../services/notificationService';

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const notifs = notificationService.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleDelete = (id) => {
    notificationService.deleteNotification(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    loadNotifications();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <SuccessIcon color="success" />;
      case 'reminder': return <ActiveIcon color="primary" />;
      default: return <InfoIcon color="info" />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 400, p: 2, mt: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">🔔 התראות</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {notifications.length === 0 ? (
            <Alert severity="info">אין התראות חדשות 😊</Alert>
          ) : (
            <List>
              {notifications.map((n) => (
                <Paper key={n.id} sx={{ mb: 1, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                    {getIcon(n.type)}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {n.title}
                      </Typography>
                      <Typography variant="body2">{n.message}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleDelete(n.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </List>
          )}

          {notifications.length > 0 && (
            <Button fullWidth onClick={handleClearAll}>נקה הכל</Button>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default NotificationCenter;
