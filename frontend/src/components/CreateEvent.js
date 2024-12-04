import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';

function CreateEvent() {
  // useNavigete() to navigate throughout the app, redirect the user to different routes
  const navigate = useNavigate();
  // formData initialized with empty values
  // setFormData updates the formData 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    location: '',
  });
  // handleChange function update the corresponding field in the form data state based on user's input
  // ...formData preserves the previous values and only change field were new form is different
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // retrieves current authenticated session using Auth.currentSession() from AWS Amplify
      const session = await Auth.currentSession();
          // const token = session.getIdToken().getJwtToken();
      // Making a post request to the/events endpoint using API.post to the backend and the formData as the body
      // Upon success of event creation, it navigates to the user homepage, logged to the console otherwise
      await API.post('events', '/events', {
        headers: {
           // Authorization: token
        },
        body: formData,
      });
      navigate('/');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Event
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            fullWidth
            label="Date and Time"
            name="datetime"
            type="datetime-local"
            value={formData.datetime}
            onChange={handleChange}
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Create Event
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default CreateEvent; 
