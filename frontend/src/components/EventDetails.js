import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import {
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      window.DEBUG_LOG('Fetching event details for:', id);
      // API GET call to get the event with matching id
      const eventData = await API.get('events', `/events/${id}`);
      window.DEBUG_LOG('Event data:', eventData);
      setEvent(eventData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      window.DEBUG_LOG('Signing up for event:', id);
      
      // Get current user's email
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      window.DEBUG_LOG('User email:', userEmail);
      
      const response = await API.post('events', '/events/signup', {
        body: { 
          eventId: id,
          userEmail 
        }
      });
      window.DEBUG_LOG('Signup response:', response);
      
      // Show success message
      setError(null);
      alert('Successfully signed up for event!');
      
      // Refresh event details
      fetchEventDetails();
    } catch (error) {
      window.DEBUG_LOG('Error signing up for event:', error);
      // Get the error message from the server response if available
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5">Event not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="h4" gutterBottom>
          {event.title}
        </Typography>
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" paragraph>
            {event.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Date: {new Date(event.datetime).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Location: {event.location}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSignUp}
          sx={{ mt: 2 }}
        >
          Sign Up for Event
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Participants
        </Typography>
        <List>
          {event.participants && event.participants.map((participant, index) => (
            <ListItem key={index}>
              <ListItemText primary={participant} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default EventDetails; 
