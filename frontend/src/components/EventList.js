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
  Paper,
} from '@mui/material';

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
      // Make the API call
      window.DEBUG_LOG('Making API call to:', process.env.REACT_APP_API_URL);
      const response = await API.get('events', '/events');
      window.DEBUG_LOG('API response:', response);
      
      setEvents(response);
      setLoading(false);
      setError(null);
    } catch (error) {
      window.DEBUG_LOG('Error in fetchEvents:', {
        message: error.message,
        code: error.code,
        name: error.name,
        response: error.response?.data
      });
      
      setError(error.message || 'An error occurred while fetching events');
      setLoading(false);
    }
  };

  const handleSignUp = async (eventId) => {
    try {
      window.DEBUG_LOG('Signing up for event:', eventId);
      
      // Get current user's email
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      window.DEBUG_LOG('User email:', userEmail);
      
      const response = await API.post('events', '/events/signup', {
        body: { 
          eventId,
          userEmail 
        }
      });
      window.DEBUG_LOG('Signup response:', response);
      
      // Show success message
      setError(null);
      alert('Successfully signed up for event!');
      
      // Refresh events list
      fetchEvents();
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
      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No events available. Create a new event to get started!
          </Typography>
        </Paper>
      ) : (
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
      )}
    </Container>
  );
}

export default EventList; 