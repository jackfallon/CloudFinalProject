import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';

function Navigation({ signOut, user }) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Event Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            Events
          </Button>
          <Button color="inherit" component={RouterLink} to="/create-event">
            Create Event
          </Button>
          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 