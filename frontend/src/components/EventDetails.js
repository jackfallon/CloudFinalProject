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
} from '@mui/material';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const eventData = await API.get('events', `/events/${id}`, {
        headers: {
          Authorization: token
        }
      });
      setEvent(eventData);
      // Fetch participants if available in your API
      const participantsData = await API.get('events', `/events/${id}/participants`, {
        headers: {
          Authorization: token
        }
      });
      setParticipants(participantsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      await API.post('events', '/events/signup', {
        headers: {
          Authorization: token
        },
        body: { eventId: id }
      });
      // Refresh participants list
      fetchEventDetails();
    } catch (error) {
      console.error('Error signing up for event:', error);
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
          {participants.map((participant) => (
            <ListItem key={participant.id}>
              <ListItemText primary={participant.name} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default EventDetails; 