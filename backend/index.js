const AWS = require('aws-sdk');

// Common headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
};

// Empty events database
let events = [];

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Handle different HTTP methods and paths
    if (event.httpMethod === 'GET' && event.resource === '/events') {
      // Return all events
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(events)
      };
    }
    
    if (event.httpMethod === 'GET' && event.resource === '/events/{id}') {
      // Return specific event
      const eventId = event.pathParameters.id;
      const foundEvent = events.find(e => e.id === eventId);
      
      if (!foundEvent) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Event not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(foundEvent)
      };
    }
    
    if (event.httpMethod === 'POST' && event.resource === '/events') {
      const body = JSON.parse(event.body);
      const newEvent = {
        id: String(events.length + 1),
        ...body,
        participants: []
      };
      events.push(newEvent);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Event created successfully',
          event: newEvent
        })
      };
    }
    
    if (event.httpMethod === 'POST' && event.resource === '/events/signup') {
      const body = JSON.parse(event.body);
      const { eventId, userEmail } = body;
      const eventIndex = events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Event not found' })
        };
      }
      
      // Check if user is already signed up
      if (events[eventIndex].participants.includes(userEmail)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'You are already signed up for this event' })
        };
      }
      
      // Add the user's email to the participants list
      events[eventIndex].participants.push(userEmail);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Successfully signed up for event',
          eventId: eventId,
          participant: userEmail
        })
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Route not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message
      })
    };
  }
}; 