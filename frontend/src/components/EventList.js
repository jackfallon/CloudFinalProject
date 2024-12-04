import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

// Debug function that won't be minified
window.DEBUG_LOG = (...args) => {
  if (process.env.REACT_APP_DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
};

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.DEBUG_LOG('EventList component mounted');
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    window.DEBUG_LOG('Starting fetchEvents');
    try {
      // Get the current authenticated session
      const session = await Auth.currentSession();
      window.DEBUG_LOG('Current session:', session);
      
      // Get the ID token
      const token = session.getIdToken().getJwtToken();
      window.DEBUG_LOG('ID token:', token);

      // Make the API call with the token
      const response = await API.get('events', '/events');
      window.DEBUG_LOG('API response:', response);
      
      setEvents(response);
      setLoading(false);
      setError(null);
    } catch (error) {
      window.DEBUG_LOG('Error in fetchEvents:', error);
      setError(error.message || 'An error occurred while fetching events');
      setLoading(false);
    }
  };

  const handleSignUp = async (eventId) => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      await API.post('events', '/events/signup', {
        body: { eventId }
      });
      
      fetchEvents();
    } catch (error) {
      window.DEBUG_LOG('Error signing up for event:', error);
      setError(error.message || 'An error occurred while signing up for the event');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Available Events
      </Typography>
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Date: {new Date(event.datetime).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Location: {event.location}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/event/${event.id}`)}>
                  View Details
                </Button>
                <Button size="small" onClick={() => handleSignUp(event.id)}>
                  Sign Up
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default EventList; 