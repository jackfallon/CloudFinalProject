const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Extract the authorization header
  const authHeader = event.headers ? event.headers.Authorization || event.headers.authorization : undefined;
  console.log('Auth header:', authHeader);
  
  if (!authHeader) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Authorization header is missing' })
    };
  }

  try {
    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const userInfo = await cognito.getUser({
      AccessToken: token
    }).promise();
    
    console.log('User info:', JSON.stringify(userInfo, null, 2));

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        // Return mock events for now
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify([
            {
              id: '1',
              title: 'Sample Event 1',
              description: 'This is a sample event',
              datetime: new Date().toISOString(),
              location: 'Sample Location'
            }
          ])
        };
      
      case 'POST':
        // Handle event creation
        const body = JSON.parse(event.body);
        // Add event creation logic here
        return {
          statusCode: 201,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ message: 'Event created successfully' })
        };
      
      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ message: 'Invalid or expired token', error: error.message })
    };
  }
}; 